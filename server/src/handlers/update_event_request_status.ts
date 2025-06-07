
import { db } from '../db';
import { eventRequestsTable, menusTable, serviceOptionsTable } from '../db/schema';
import { type UpdateEventRequestStatusInput, type EventRequestWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEventRequestStatus = async (input: UpdateEventRequestStatusInput): Promise<EventRequestWithDetails> => {
  try {
    // Update the event request status and checkout_url
    const updateResult = await db.update(eventRequestsTable)
      .set({
        status: input.status,
        checkout_url: input.checkout_url,
        updated_at: new Date()
      })
      .where(eq(eventRequestsTable.id, input.id))
      .returning()
      .execute();

    if (updateResult.length === 0) {
      throw new Error(`Event request with id ${input.id} not found`);
    }

    const updatedEventRequest = updateResult[0];

    // Fetch the related menu and service option data
    const result = await db.select()
      .from(eventRequestsTable)
      .innerJoin(menusTable, eq(eventRequestsTable.menu_id, menusTable.id))
      .innerJoin(serviceOptionsTable, eq(eventRequestsTable.service_option_id, serviceOptionsTable.id))
      .where(eq(eventRequestsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Event request with id ${input.id} not found after update`);
    }

    const joinedResult = result[0];

    // Return the event request with details, converting numeric fields
    return {
      id: joinedResult.event_requests.id,
      customer_name: joinedResult.event_requests.customer_name,
      customer_email: joinedResult.event_requests.customer_email,
      customer_phone: joinedResult.event_requests.customer_phone,
      menu_id: joinedResult.event_requests.menu_id,
      service_option_id: joinedResult.event_requests.service_option_id,
      event_date: new Date(joinedResult.event_requests.event_date),
      event_time: joinedResult.event_requests.event_time,
      location: joinedResult.event_requests.location,
      guest_count: joinedResult.event_requests.guest_count,
      special_requests: joinedResult.event_requests.special_requests,
      dietary_restrictions: joinedResult.event_requests.dietary_restrictions,
      total_price: parseFloat(joinedResult.event_requests.total_price),
      status: joinedResult.event_requests.status,
      medusa_request_id: joinedResult.event_requests.medusa_request_id,
      checkout_url: joinedResult.event_requests.checkout_url,
      created_at: joinedResult.event_requests.created_at,
      updated_at: joinedResult.event_requests.updated_at,
      menu: {
        id: joinedResult.menus.id,
        name: joinedResult.menus.name,
        description: joinedResult.menus.description,
        thumbnail_image_url: joinedResult.menus.thumbnail_image_url,
        average_rating: joinedResult.menus.average_rating ? parseFloat(joinedResult.menus.average_rating) : null,
        created_at: joinedResult.menus.created_at,
        updated_at: joinedResult.menus.updated_at
      },
      service_option: {
        id: joinedResult.service_options.id,
        menu_id: joinedResult.service_options.menu_id,
        service_type: joinedResult.service_options.service_type,
        price_per_person: parseFloat(joinedResult.service_options.price_per_person),
        description: joinedResult.service_options.description,
        created_at: joinedResult.service_options.created_at
      }
    };
  } catch (error) {
    console.error('Event request status update failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { eventRequestsTable, menusTable, serviceOptionsTable } from '../db/schema';
import { type EventRequestWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getEventRequests = async (): Promise<EventRequestWithDetails[]> => {
  try {
    const results = await db.select()
      .from(eventRequestsTable)
      .innerJoin(menusTable, eq(eventRequestsTable.menu_id, menusTable.id))
      .innerJoin(serviceOptionsTable, eq(eventRequestsTable.service_option_id, serviceOptionsTable.id))
      .execute();

    return results.map(result => ({
      // Event request data
      id: result.event_requests.id,
      customer_name: result.event_requests.customer_name,
      customer_email: result.event_requests.customer_email,
      customer_phone: result.event_requests.customer_phone,
      menu_id: result.event_requests.menu_id,
      service_option_id: result.event_requests.service_option_id,
      event_date: new Date(result.event_requests.event_date),
      event_time: result.event_requests.event_time,
      location: result.event_requests.location,
      guest_count: result.event_requests.guest_count,
      special_requests: result.event_requests.special_requests,
      dietary_restrictions: result.event_requests.dietary_restrictions,
      total_price: parseFloat(result.event_requests.total_price),
      status: result.event_requests.status,
      medusa_request_id: result.event_requests.medusa_request_id,
      checkout_url: result.event_requests.checkout_url,
      created_at: result.event_requests.created_at,
      updated_at: result.event_requests.updated_at,
      // Menu data
      menu: {
        id: result.menus.id,
        name: result.menus.name,
        description: result.menus.description,
        thumbnail_image_url: result.menus.thumbnail_image_url,
        average_rating: result.menus.average_rating ? parseFloat(result.menus.average_rating) : null,
        created_at: result.menus.created_at,
        updated_at: result.menus.updated_at
      },
      // Service option data
      service_option: {
        id: result.service_options.id,
        menu_id: result.service_options.menu_id,
        service_type: result.service_options.service_type,
        price_per_person: parseFloat(result.service_options.price_per_person),
        description: result.service_options.description,
        created_at: result.service_options.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get event requests:', error);
    throw error;
  }
};

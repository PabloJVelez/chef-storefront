
import { db } from '../db';
import { eventRequestsTable, menusTable, serviceOptionsTable } from '../db/schema';
import { type CreateEventRequestInput, type EventRequestWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const createEventRequest = async (input: CreateEventRequestInput): Promise<EventRequestWithDetails> => {
  try {
    // Verify menu exists
    const menu = await db.select()
      .from(menusTable)
      .where(eq(menusTable.id, input.menu_id))
      .execute();

    if (menu.length === 0) {
      throw new Error(`Menu with id ${input.menu_id} not found`);
    }

    // Verify service option exists and belongs to the menu
    const serviceOption = await db.select()
      .from(serviceOptionsTable)
      .where(eq(serviceOptionsTable.id, input.service_option_id))
      .execute();

    if (serviceOption.length === 0) {
      throw new Error(`Service option with id ${input.service_option_id} not found`);
    }

    if (serviceOption[0].menu_id !== input.menu_id) {
      throw new Error(`Service option ${input.service_option_id} does not belong to menu ${input.menu_id}`);
    }

    // Calculate total price
    const pricePerPerson = parseFloat(serviceOption[0].price_per_person);
    const totalPrice = pricePerPerson * input.guest_count;

    // Format date as YYYY-MM-DD string for date column
    const eventDateString = input.event_date.toISOString().split('T')[0];

    // Insert event request
    const result = await db.insert(eventRequestsTable)
      .values({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        menu_id: input.menu_id,
        service_option_id: input.service_option_id,
        event_date: eventDateString,
        event_time: input.event_time,
        location: input.location,
        guest_count: input.guest_count,
        special_requests: input.special_requests,
        dietary_restrictions: input.dietary_restrictions,
        total_price: totalPrice.toString()
      })
      .returning()
      .execute();

    const eventRequest = result[0];

    // Return the complete event request with details
    return {
      ...eventRequest,
      event_date: new Date(eventRequest.event_date), // Convert string back to Date
      total_price: parseFloat(eventRequest.total_price),
      menu: {
        ...menu[0],
        average_rating: menu[0].average_rating ? parseFloat(menu[0].average_rating) : null
      },
      service_option: {
        ...serviceOption[0],
        price_per_person: parseFloat(serviceOption[0].price_per_person)
      }
    };
  } catch (error) {
    console.error('Event request creation failed:', error);
    throw error;
  }
};

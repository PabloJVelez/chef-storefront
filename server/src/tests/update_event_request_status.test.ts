
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { type UpdateEventRequestStatusInput } from '../schema';
import { updateEventRequestStatus } from '../handlers/update_event_request_status';
import { eq } from 'drizzle-orm';

describe('updateEventRequestStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update event request status', async () => {
    // Create prerequisite data
    const menu = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const serviceOption = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu[0].id,
        service_type: 'plated',
        price_per_person: '25.00'
      })
      .returning()
      .execute();

    const eventRequest = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
        menu_id: menu[0].id,
        service_option_id: serviceOption[0].id,
        event_date: '2024-12-25',
        event_time: '18:00:00',
        location: 'Test Location',
        guest_count: 10,
        total_price: '250.00',
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest[0].id,
      status: 'accepted',
      checkout_url: 'https://example.com/checkout/123'
    };

    const result = await updateEventRequestStatus(input);

    // Verify the updated status and checkout URL
    expect(result.id).toEqual(eventRequest[0].id);
    expect(result.status).toEqual('accepted');
    expect(result.checkout_url).toEqual('https://example.com/checkout/123');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify other fields remain unchanged
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.total_price).toEqual(250.00);
    expect(result.event_date).toBeInstanceOf(Date);

    // Verify related data is included
    expect(result.menu).toBeDefined();
    expect(result.menu.name).toEqual('Test Menu');
    expect(result.service_option).toBeDefined();
    expect(result.service_option.service_type).toEqual('plated');
    expect(result.service_option.price_per_person).toEqual(25.00);
  });

  it('should update status to confirmed with null checkout_url', async () => {
    // Create prerequisite data
    const menu = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const serviceOption = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu[0].id,
        service_type: 'buffet',
        price_per_person: '30.00'
      })
      .returning()
      .execute();

    const eventRequest = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        menu_id: menu[0].id,
        service_option_id: serviceOption[0].id,
        event_date: '2024-12-30',
        event_time: '19:00:00',
        location: 'Another Location',
        guest_count: 20,
        total_price: '600.00',
        status: 'accepted'
      })
      .returning()
      .execute();

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest[0].id,
      status: 'confirmed',
      checkout_url: null
    };

    const result = await updateEventRequestStatus(input);

    expect(result.status).toEqual('confirmed');
    expect(result.checkout_url).toBeNull();
    expect(result.customer_name).toEqual('Jane Smith');
    expect(result.event_date).toBeInstanceOf(Date);
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
    const menu = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const serviceOption = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu[0].id,
        service_type: 'cook-along',
        price_per_person: '40.00'
      })
      .returning()
      .execute();

    const eventRequest = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Bob Wilson',
        customer_email: 'bob@example.com',
        menu_id: menu[0].id,
        service_option_id: serviceOption[0].id,
        event_date: '2025-01-15',
        event_time: '12:00:00',
        location: 'Bob\'s Kitchen',
        guest_count: 8,
        total_price: '320.00',
        status: 'pending'
      })
      .returning()
      .execute();

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest[0].id,
      status: 'rejected',
      checkout_url: null
    };

    await updateEventRequestStatus(input);

    // Verify the changes were persisted to database
    const updatedEventRequests = await db.select()
      .from(eventRequestsTable)
      .where(eq(eventRequestsTable.id, eventRequest[0].id))
      .execute();

    expect(updatedEventRequests).toHaveLength(1);
    expect(updatedEventRequests[0].status).toEqual('rejected');
    expect(updatedEventRequests[0].checkout_url).toBeNull();
    expect(updatedEventRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent event request', async () => {
    const input: UpdateEventRequestStatusInput = {
      id: 99999,
      status: 'accepted',
      checkout_url: null
    };

    expect(updateEventRequestStatus(input)).rejects.toThrow(/not found/i);
  });
});

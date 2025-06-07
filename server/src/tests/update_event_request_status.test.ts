
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

  it('should update event request status and return with details', async () => {
    // Create test menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    // Create test service option
    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'plated',
        price_per_person: '50.00'
      })
      .returning()
      .execute();

    const serviceOption = serviceOptionResult[0];

    // Create test event request
    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-12-25',
        event_time: '19:00:00',
        location: 'Test Location',
        guest_count: 10,
        total_price: '500.00',
        status: 'pending'
      })
      .returning()
      .execute();

    const eventRequest = eventRequestResult[0];

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest.id,
      status: 'accepted',
      checkout_url: 'https://example.com/checkout/123'
    };

    const result = await updateEventRequestStatus(input);

    // Verify updated fields
    expect(result.id).toEqual(eventRequest.id);
    expect(result.status).toEqual('accepted');
    expect(result.checkout_url).toEqual('https://example.com/checkout/123');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify original fields are preserved
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.guest_count).toEqual(10);
    expect(result.total_price).toEqual(500.00);
    expect(typeof result.total_price).toBe('number');

    // Verify date conversion
    expect(result.event_date).toBeInstanceOf(Date);
    expect(result.event_date.getFullYear()).toEqual(2024);
    expect(result.event_date.getMonth()).toEqual(11); // December is month 11

    // Verify menu details are included
    expect(result.menu).toBeDefined();
    expect(result.menu.id).toEqual(menu.id);
    expect(result.menu.name).toEqual('Test Menu');

    // Verify service option details are included
    expect(result.service_option).toBeDefined();
    expect(result.service_option.id).toEqual(serviceOption.id);
    expect(result.service_option.service_type).toEqual('plated');
    expect(result.service_option.price_per_person).toEqual(50.00);
    expect(typeof result.service_option.price_per_person).toBe('number');
  });

  it('should update status to null checkout_url', async () => {
    // Create test menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    // Create test service option
    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'buffet',
        price_per_person: '35.00'
      })
      .returning()
      .execute();

    const serviceOption = serviceOptionResult[0];

    // Create test event request
    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-12-30',
        event_time: '18:30:00',
        location: 'Another Location',
        guest_count: 15,
        total_price: '525.00',
        status: 'pending',
        checkout_url: 'https://old-checkout.com'
      })
      .returning()
      .execute();

    const eventRequest = eventRequestResult[0];

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest.id,
      status: 'rejected',
      checkout_url: null
    };

    const result = await updateEventRequestStatus(input);

    expect(result.status).toEqual('rejected');
    expect(result.checkout_url).toBeNull();
  });

  it('should save updated status to database', async () => {
    // Create test menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    // Create test service option
    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'cook-along',
        price_per_person: '75.00'
      })
      .returning()
      .execute();

    const serviceOption = serviceOptionResult[0];

    // Create test event request
    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Bob Wilson',
        customer_email: 'bob@example.com',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2025-01-15',
        event_time: '20:00:00',
        location: 'Bob\'s Kitchen',
        guest_count: 8,
        total_price: '600.00',
        status: 'pending'
      })
      .returning()
      .execute();

    const eventRequest = eventRequestResult[0];

    const input: UpdateEventRequestStatusInput = {
      id: eventRequest.id,
      status: 'confirmed',
      checkout_url: 'https://confirmed-checkout.com'
    };

    await updateEventRequestStatus(input);

    // Verify in database
    const updatedEventRequests = await db.select()
      .from(eventRequestsTable)
      .where(eq(eventRequestsTable.id, eventRequest.id))
      .execute();

    expect(updatedEventRequests).toHaveLength(1);
    expect(updatedEventRequests[0].status).toEqual('confirmed');
    expect(updatedEventRequests[0].checkout_url).toEqual('https://confirmed-checkout.com');
    expect(updatedEventRequests[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent event request', async () => {
    const input: UpdateEventRequestStatusInput = {
      id: 99999,
      status: 'accepted',
      checkout_url: 'https://example.com/checkout'
    };

    expect(updateEventRequestStatus(input)).rejects.toThrow(/not found/i);
  });
});

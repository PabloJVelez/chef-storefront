
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { getEventRequestById } from '../handlers/get_event_request_by_id';

describe('getEventRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return event request with details when found', async () => {
    // Create menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    const menu = menuResult[0];

    // Create service option
    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'plated',
        price_per_person: '50.00',
        description: 'Plated service'
      })
      .returning()
      .execute();
    const serviceOption = serviceOptionResult[0];

    // Create event request
    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '123-456-7890',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-06-15',
        event_time: '18:00:00',
        location: '123 Main St',
        guest_count: 25,
        special_requests: 'Extra napkins',
        dietary_restrictions: 'No nuts',
        total_price: '1250.00',
        status: 'pending'
      })
      .returning()
      .execute();
    const eventRequest = eventRequestResult[0];

    const result = await getEventRequestById(eventRequest.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(eventRequest.id);
    expect(result!.customer_name).toEqual('John Doe');
    expect(result!.customer_email).toEqual('john@example.com');
    expect(result!.customer_phone).toEqual('123-456-7890');
    expect(result!.menu_id).toEqual(menu.id);
    expect(result!.service_option_id).toEqual(serviceOption.id);
    expect(result!.event_date).toBeInstanceOf(Date);
    expect(result!.event_date.toISOString().split('T')[0]).toEqual('2024-06-15');
    expect(result!.event_time).toEqual('18:00:00');
    expect(result!.location).toEqual('123 Main St');
    expect(result!.guest_count).toEqual(25);
    expect(result!.special_requests).toEqual('Extra napkins');
    expect(result!.dietary_restrictions).toEqual('No nuts');
    expect(result!.total_price).toEqual(1250.00);
    expect(typeof result!.total_price).toBe('number');
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify menu details
    expect(result!.menu.id).toEqual(menu.id);
    expect(result!.menu.name).toEqual('Test Menu');
    expect(result!.menu.description).toEqual('A test menu');
    expect(result!.menu.thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(result!.menu.created_at).toBeInstanceOf(Date);
    expect(result!.menu.updated_at).toBeInstanceOf(Date);

    // Verify service option details
    expect(result!.service_option.id).toEqual(serviceOption.id);
    expect(result!.service_option.menu_id).toEqual(menu.id);
    expect(result!.service_option.service_type).toEqual('plated');
    expect(result!.service_option.price_per_person).toEqual(50.00);
    expect(typeof result!.service_option.price_per_person).toBe('number');
    expect(result!.service_option.description).toEqual('Plated service');
    expect(result!.service_option.created_at).toBeInstanceOf(Date);
  });

  it('should return null when event request not found', async () => {
    const result = await getEventRequestById(999);
    expect(result).toBeNull();
  });

  it('should handle numeric conversions correctly', async () => {
    // Create menu with average rating
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        average_rating: '4.50'
      })
      .returning()
      .execute();
    const menu = menuResult[0];

    // Create service option
    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'buffet',
        price_per_person: '75.99'
      })
      .returning()
      .execute();
    const serviceOption = serviceOptionResult[0];

    // Create event request
    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-07-20',
        event_time: '19:30:00',
        location: '456 Oak Ave',
        guest_count: 30,
        total_price: '2277.70'
      })
      .returning()
      .execute();
    const eventRequest = eventRequestResult[0];

    const result = await getEventRequestById(eventRequest.id);

    expect(result).toBeDefined();
    expect(result!.total_price).toEqual(2277.70);
    expect(typeof result!.total_price).toBe('number');
    expect(result!.menu.average_rating).toEqual(4.50);
    expect(typeof result!.menu.average_rating).toBe('number');
    expect(result!.service_option.price_per_person).toEqual(75.99);
    expect(typeof result!.service_option.price_per_person).toBe('number');
    expect(result!.event_date).toBeInstanceOf(Date);
    expect(result!.event_date.toISOString().split('T')[0]).toEqual('2024-07-20');
  });
});

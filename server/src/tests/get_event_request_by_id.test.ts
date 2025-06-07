
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { getEventRequestById } from '../handlers/get_event_request_by_id';

describe('getEventRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return event request with details', async () => {
    // Create prerequisite data
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuResult[0].id,
        service_type: 'plated',
        price_per_person: '25.00',
        description: 'Plated service option'
      })
      .returning()
      .execute();

    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '+1234567890',
        menu_id: menuResult[0].id,
        service_option_id: serviceOptionResult[0].id,
        event_date: '2024-12-25',
        event_time: '18:00:00',
        location: 'Test Venue',
        guest_count: 50,
        special_requests: 'Vegan options please',
        dietary_restrictions: 'Gluten-free',
        total_price: '1250.00',
        status: 'pending',
        medusa_request_id: 'med_123',
        checkout_url: 'https://checkout.example.com'
      })
      .returning()
      .execute();

    const result = await getEventRequestById(eventRequestResult[0].id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(eventRequestResult[0].id);
    expect(result!.customer_name).toEqual('John Doe');
    expect(result!.customer_email).toEqual('john@example.com');
    expect(result!.customer_phone).toEqual('+1234567890');
    expect(result!.event_date).toBeInstanceOf(Date);
    expect(result!.event_date.toISOString().split('T')[0]).toEqual('2024-12-25');
    expect(result!.event_time).toEqual('18:00:00');
    expect(result!.location).toEqual('Test Venue');
    expect(result!.guest_count).toEqual(50);
    expect(result!.special_requests).toEqual('Vegan options please');
    expect(result!.dietary_restrictions).toEqual('Gluten-free');
    expect(result!.total_price).toEqual(1250.00);
    expect(typeof result!.total_price).toBe('number');
    expect(result!.status).toEqual('pending');
    expect(result!.medusa_request_id).toEqual('med_123');
    expect(result!.checkout_url).toEqual('https://checkout.example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify menu relation
    expect(result!.menu).toBeDefined();
    expect(result!.menu.id).toEqual(menuResult[0].id);
    expect(result!.menu.name).toEqual('Test Menu');
    expect(result!.menu.description).toEqual('A test menu');
    expect(result!.menu.thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(result!.menu.average_rating).toBeNull();
    expect(result!.menu.created_at).toBeInstanceOf(Date);
    expect(result!.menu.updated_at).toBeInstanceOf(Date);

    // Verify service option relation
    expect(result!.service_option).toBeDefined();
    expect(result!.service_option.id).toEqual(serviceOptionResult[0].id);
    expect(result!.service_option.menu_id).toEqual(menuResult[0].id);
    expect(result!.service_option.service_type).toEqual('plated');
    expect(result!.service_option.price_per_person).toEqual(25.00);
    expect(typeof result!.service_option.price_per_person).toBe('number');
    expect(result!.service_option.description).toEqual('Plated service option');
    expect(result!.service_option.created_at).toBeInstanceOf(Date);
  });

  it('should return null for nonexistent event request', async () => {
    const result = await getEventRequestById(999);
    expect(result).toBeNull();
  });

  it('should handle numeric conversions correctly', async () => {
    // Create prerequisite data
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        average_rating: '4.50'
      })
      .returning()
      .execute();

    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuResult[0].id,
        service_type: 'buffet',
        price_per_person: '15.99',
        description: 'Buffet service'
      })
      .returning()
      .execute();

    const eventRequestResult = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        menu_id: menuResult[0].id,
        service_option_id: serviceOptionResult[0].id,
        event_date: '2024-11-15',
        event_time: '12:00:00',
        location: 'Conference Center',
        guest_count: 25,
        total_price: '399.75',
        status: 'confirmed'
      })
      .returning()
      .execute();

    const result = await getEventRequestById(eventRequestResult[0].id);

    expect(result).toBeDefined();
    expect(result!.total_price).toEqual(399.75);
    expect(typeof result!.total_price).toBe('number');
    expect(result!.menu.average_rating).toEqual(4.50);
    expect(typeof result!.menu.average_rating).toBe('number');
    expect(result!.service_option.price_per_person).toEqual(15.99);
    expect(typeof result!.service_option.price_per_person).toBe('number');
  });
});

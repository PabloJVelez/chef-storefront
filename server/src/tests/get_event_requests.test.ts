
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { getEventRequests } from '../handlers/get_event_requests';

describe('getEventRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no event requests exist', async () => {
    const result = await getEventRequests();
    expect(result).toEqual([]);
  });

  it('should return event request with related menu and service option', async () => {
    // Create prerequisite data
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'http://example.com/image.jpg',
        average_rating: '4.5'
      })
      .returning()
      .execute();

    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuResult[0].id,
        service_type: 'plated',
        price_per_person: '25.99',
        description: 'Plated service option'
      })
      .returning()
      .execute();

    await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
        menu_id: menuResult[0].id,
        service_option_id: serviceOptionResult[0].id,
        event_date: '2024-06-15', // Use string format for database insert
        event_time: '18:00:00',
        location: '123 Main St',
        guest_count: 20,
        special_requests: 'Extra dessert',
        dietary_restrictions: 'Vegetarian',
        total_price: '519.80',
        status: 'pending',
        medusa_request_id: 'req_123',
        checkout_url: 'http://checkout.example.com'
      })
      .execute();

    const result = await getEventRequests();

    expect(result).toHaveLength(1);
    
    const eventRequest = result[0];
    
    // Verify event request fields
    expect(eventRequest.customer_name).toEqual('John Doe');
    expect(eventRequest.customer_email).toEqual('john@example.com');
    expect(eventRequest.customer_phone).toEqual('555-1234');
    expect(eventRequest.event_date).toEqual(new Date('2024-06-15'));
    expect(eventRequest.event_date).toBeInstanceOf(Date);
    expect(eventRequest.event_time).toEqual('18:00:00');
    expect(eventRequest.location).toEqual('123 Main St');
    expect(eventRequest.guest_count).toEqual(20);
    expect(eventRequest.special_requests).toEqual('Extra dessert');
    expect(eventRequest.dietary_restrictions).toEqual('Vegetarian');
    expect(eventRequest.total_price).toEqual(519.80);
    expect(typeof eventRequest.total_price).toEqual('number');
    expect(eventRequest.status).toEqual('pending');
    expect(eventRequest.medusa_request_id).toEqual('req_123');
    expect(eventRequest.checkout_url).toEqual('http://checkout.example.com');
    expect(eventRequest.created_at).toBeInstanceOf(Date);
    expect(eventRequest.updated_at).toBeInstanceOf(Date);

    // Verify menu relation
    expect(eventRequest.menu.name).toEqual('Test Menu');
    expect(eventRequest.menu.description).toEqual('A test menu');
    expect(eventRequest.menu.thumbnail_image_url).toEqual('http://example.com/image.jpg');
    expect(eventRequest.menu.average_rating).toEqual(4.5);
    expect(typeof eventRequest.menu.average_rating).toEqual('number');
    expect(eventRequest.menu.created_at).toBeInstanceOf(Date);
    expect(eventRequest.menu.updated_at).toBeInstanceOf(Date);

    // Verify service option relation
    expect(eventRequest.service_option.service_type).toEqual('plated');
    expect(eventRequest.service_option.price_per_person).toEqual(25.99);
    expect(typeof eventRequest.service_option.price_per_person).toEqual('number');
    expect(eventRequest.service_option.description).toEqual('Plated service option');
    expect(eventRequest.service_option.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple event requests with different statuses', async () => {
    // Create prerequisite data
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Wedding Menu',
        description: 'Perfect for weddings',
        thumbnail_image_url: null,
        average_rating: null
      })
      .returning()
      .execute();

    const serviceOptionResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuResult[0].id,
        service_type: 'buffet',
        price_per_person: '35.00',
        description: null
      })
      .returning()
      .execute();

    // Create multiple event requests
    await db.insert(eventRequestsTable)
      .values([
        {
          customer_name: 'Alice Smith',
          customer_email: 'alice@example.com',
          customer_phone: null,
          menu_id: menuResult[0].id,
          service_option_id: serviceOptionResult[0].id,
          event_date: '2024-07-01', // Use string format for database insert
          event_time: '19:00:00',
          location: 'Grand Ballroom',
          guest_count: 50,
          special_requests: null,
          dietary_restrictions: null,
          total_price: '1750.00',
          status: 'accepted',
          medusa_request_id: null,
          checkout_url: null
        },
        {
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          customer_phone: '555-9876',
          menu_id: menuResult[0].id,
          service_option_id: serviceOptionResult[0].id,
          event_date: '2024-08-15', // Use string format for database insert
          event_time: '17:30:00',
          location: 'Garden Venue',
          guest_count: 30,
          special_requests: 'Outdoor setup',
          dietary_restrictions: 'Gluten-free',
          total_price: '1050.00',
          status: 'confirmed',
          medusa_request_id: 'req_456',
          checkout_url: 'http://pay.example.com'
        }
      ])
      .execute();

    const result = await getEventRequests();

    expect(result).toHaveLength(2);
    expect(result[0].customer_name).toEqual('Alice Smith');
    expect(result[0].status).toEqual('accepted');
    expect(result[0].total_price).toEqual(1750.00);
    expect(result[0].customer_phone).toBeNull();
    expect(result[0].menu.average_rating).toBeNull();
    expect(result[0].service_option.description).toBeNull();
    expect(result[0].event_date).toEqual(new Date('2024-07-01'));
    expect(result[0].event_date).toBeInstanceOf(Date);

    expect(result[1].customer_name).toEqual('Bob Johnson');
    expect(result[1].status).toEqual('confirmed');
    expect(result[1].total_price).toEqual(1050.00);
    expect(result[1].special_requests).toEqual('Outdoor setup');
    expect(result[1].event_date).toEqual(new Date('2024-08-15'));
    expect(result[1].event_date).toBeInstanceOf(Date);
  });
});

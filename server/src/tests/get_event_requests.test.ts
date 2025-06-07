
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

  it('should return event requests with menu and service option details', async () => {
    // Create test menu
    const [menu] = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg',
        average_rating: '4.5'
      })
      .returning()
      .execute();

    // Create test service option
    const [serviceOption] = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'plated',
        price_per_person: '25.00',
        description: 'Plated service option'
      })
      .returning()
      .execute();

    // Create test event request
    const [eventRequest] = await db.insert(eventRequestsTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '555-1234',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-02-15',
        event_time: '18:00:00',
        location: '123 Main St',
        guest_count: 10,
        special_requests: 'Vegetarian options',
        dietary_restrictions: 'No nuts',
        total_price: '250.00',
        status: 'pending',
        medusa_request_id: 'medusa_123',
        checkout_url: 'https://checkout.example.com'
      })
      .returning()
      .execute();

    const result = await getEventRequests();

    expect(result).toHaveLength(1);
    
    const eventRequestWithDetails = result[0];
    
    // Event request fields
    expect(eventRequestWithDetails.id).toEqual(eventRequest.id);
    expect(eventRequestWithDetails.customer_name).toEqual('John Doe');
    expect(eventRequestWithDetails.customer_email).toEqual('john@example.com');
    expect(eventRequestWithDetails.customer_phone).toEqual('555-1234');
    expect(eventRequestWithDetails.menu_id).toEqual(menu.id);
    expect(eventRequestWithDetails.service_option_id).toEqual(serviceOption.id);
    expect(eventRequestWithDetails.event_date).toEqual(new Date('2024-02-15'));
    expect(eventRequestWithDetails.event_date).toBeInstanceOf(Date);
    expect(eventRequestWithDetails.event_time).toEqual('18:00:00');
    expect(eventRequestWithDetails.location).toEqual('123 Main St');
    expect(eventRequestWithDetails.guest_count).toEqual(10);
    expect(eventRequestWithDetails.special_requests).toEqual('Vegetarian options');
    expect(eventRequestWithDetails.dietary_restrictions).toEqual('No nuts');
    expect(eventRequestWithDetails.total_price).toEqual(250.00);
    expect(typeof eventRequestWithDetails.total_price).toBe('number');
    expect(eventRequestWithDetails.status).toEqual('pending');
    expect(eventRequestWithDetails.medusa_request_id).toEqual('medusa_123');
    expect(eventRequestWithDetails.checkout_url).toEqual('https://checkout.example.com');
    expect(eventRequestWithDetails.created_at).toBeInstanceOf(Date);
    expect(eventRequestWithDetails.updated_at).toBeInstanceOf(Date);

    // Menu fields
    expect(eventRequestWithDetails.menu.id).toEqual(menu.id);
    expect(eventRequestWithDetails.menu.name).toEqual('Test Menu');
    expect(eventRequestWithDetails.menu.description).toEqual('A test menu');
    expect(eventRequestWithDetails.menu.thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(eventRequestWithDetails.menu.average_rating).toEqual(4.5);
    expect(typeof eventRequestWithDetails.menu.average_rating).toBe('number');
    expect(eventRequestWithDetails.menu.created_at).toBeInstanceOf(Date);
    expect(eventRequestWithDetails.menu.updated_at).toBeInstanceOf(Date);

    // Service option fields
    expect(eventRequestWithDetails.service_option.id).toEqual(serviceOption.id);
    expect(eventRequestWithDetails.service_option.menu_id).toEqual(menu.id);
    expect(eventRequestWithDetails.service_option.service_type).toEqual('plated');
    expect(eventRequestWithDetails.service_option.price_per_person).toEqual(25.00);
    expect(typeof eventRequestWithDetails.service_option.price_per_person).toBe('number');
    expect(eventRequestWithDetails.service_option.description).toEqual('Plated service option');
    expect(eventRequestWithDetails.service_option.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple event requests with correct details', async () => {
    // Create test menu
    const [menu] = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    // Create test service option
    const [serviceOption] = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'buffet',
        price_per_person: '20.00'
      })
      .returning()
      .execute();

    // Create two event requests
    await db.insert(eventRequestsTable)
      .values([
        {
          customer_name: 'Alice Smith',
          customer_email: 'alice@example.com',
          menu_id: menu.id,
          service_option_id: serviceOption.id,
          event_date: '2024-03-01',
          event_time: '19:00:00',
          location: 'Location A',
          guest_count: 20,
          total_price: '400.00',
          status: 'confirmed'
        },
        {
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          menu_id: menu.id,
          service_option_id: serviceOption.id,
          event_date: '2024-03-15',
          event_time: '17:30:00',
          location: 'Location B',
          guest_count: 15,
          total_price: '300.00',
          status: 'accepted'
        }
      ])
      .execute();

    const result = await getEventRequests();

    expect(result).toHaveLength(2);
    expect(result[0].customer_name).toEqual('Alice Smith');
    expect(result[0].status).toEqual('confirmed');
    expect(result[0].total_price).toEqual(400.00);
    expect(result[0].event_date).toEqual(new Date('2024-03-01'));
    expect(result[1].customer_name).toEqual('Bob Johnson');
    expect(result[1].status).toEqual('accepted');
    expect(result[1].total_price).toEqual(300.00);
    expect(result[1].event_date).toEqual(new Date('2024-03-15'));

    // Verify both have the same menu and service option details
    result.forEach(eventRequest => {
      expect(eventRequest.menu.name).toEqual('Test Menu');
      expect(eventRequest.service_option.service_type).toEqual('buffet');
      expect(eventRequest.service_option.price_per_person).toEqual(20.00);
      expect(eventRequest.event_date).toBeInstanceOf(Date);
    });
  });

  it('should handle null values correctly', async () => {
    // Create test menu with minimal data
    const [menu] = await db.insert(menusTable)
      .values({
        name: 'Minimal Menu'
      })
      .returning()
      .execute();

    // Create test service option with minimal data
    const [serviceOption] = await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu.id,
        service_type: 'cook-along',
        price_per_person: '30.00'
      })
      .returning()
      .execute();

    // Create event request with minimal data
    await db.insert(eventRequestsTable)
      .values({
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        menu_id: menu.id,
        service_option_id: serviceOption.id,
        event_date: '2024-04-01',
        event_time: '12:00:00',
        location: 'Test Location',
        guest_count: 5,
        total_price: '150.00'
      })
      .execute();

    const result = await getEventRequests();

    expect(result).toHaveLength(1);
    
    const eventRequest = result[0];
    
    // Verify null fields are handled correctly
    expect(eventRequest.customer_phone).toBeNull();
    expect(eventRequest.special_requests).toBeNull();
    expect(eventRequest.dietary_restrictions).toBeNull();
    expect(eventRequest.medusa_request_id).toBeNull();
    expect(eventRequest.checkout_url).toBeNull();
    expect(eventRequest.menu.description).toBeNull();
    expect(eventRequest.menu.thumbnail_image_url).toBeNull();
    expect(eventRequest.menu.average_rating).toBeNull();
    expect(eventRequest.service_option.description).toBeNull();
    
    // Verify date conversion works
    expect(eventRequest.event_date).toEqual(new Date('2024-04-01'));
    expect(eventRequest.event_date).toBeInstanceOf(Date);
  });
});

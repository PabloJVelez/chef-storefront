
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { type CreateEventRequestInput } from '../schema';
import { createEventRequest } from '../handlers/create_event_request';
import { eq } from 'drizzle-orm';

describe('createEventRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMenuId: number;
  let testServiceOptionId: number;

  beforeEach(async () => {
    // Create test menu
    const menu = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A menu for testing',
        thumbnail_image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    testMenuId = menu[0].id;

    // Create test service option
    const serviceOption = await db.insert(serviceOptionsTable)
      .values({
        menu_id: testMenuId,
        service_type: 'plated',
        price_per_person: '25.00',
        description: 'Plated service option'
      })
      .returning()
      .execute();

    testServiceOptionId = serviceOption[0].id;
  });

  const testInput: CreateEventRequestInput = {
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '555-1234',
    menu_id: 0, // Will be set in each test
    service_option_id: 0, // Will be set in each test
    event_date: new Date('2024-12-25'),
    event_time: '18:00',
    location: '123 Main St, City, State',
    guest_count: 10,
    special_requests: 'No allergies',
    dietary_restrictions: 'Vegetarian options needed'
  };

  it('should create an event request with correct total price calculation', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: testServiceOptionId };
    
    const result = await createEventRequest(input);

    // Basic field validation
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.customer_phone).toEqual('555-1234');
    expect(result.menu_id).toEqual(testMenuId);
    expect(result.service_option_id).toEqual(testServiceOptionId);
    expect(result.event_date).toEqual(new Date('2024-12-25'));
    expect(result.event_time).toEqual('18:00:00'); // Time column returns with seconds
    expect(result.location).toEqual('123 Main St, City, State');
    expect(result.guest_count).toEqual(10);
    expect(result.special_requests).toEqual('No allergies');
    expect(result.dietary_restrictions).toEqual('Vegetarian options needed');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Total price calculation (25.00 * 10 guests = 250.00)
    expect(result.total_price).toEqual(250);
    expect(typeof result.total_price).toBe('number');

    // Related data validation
    expect(result.menu.id).toEqual(testMenuId);
    expect(result.menu.name).toEqual('Test Menu');
    expect(result.service_option.id).toEqual(testServiceOptionId);
    expect(result.service_option.service_type).toEqual('plated');
    expect(result.service_option.price_per_person).toEqual(25);
    expect(typeof result.service_option.price_per_person).toBe('number');
  });

  it('should save event request to database', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: testServiceOptionId };
    
    const result = await createEventRequest(input);

    const eventRequests = await db.select()
      .from(eventRequestsTable)
      .where(eq(eventRequestsTable.id, result.id))
      .execute();

    expect(eventRequests).toHaveLength(1);
    expect(eventRequests[0].customer_name).toEqual('John Doe');
    expect(eventRequests[0].customer_email).toEqual('john@example.com');
    expect(eventRequests[0].guest_count).toEqual(10);
    expect(parseFloat(eventRequests[0].total_price)).toEqual(250);
    expect(eventRequests[0].status).toEqual('pending');
    expect(eventRequests[0].created_at).toBeInstanceOf(Date);
    expect(eventRequests[0].event_date).toEqual('2024-12-25'); // Date stored as string in DB
  });

  it('should handle different guest counts and calculate correct total price', async () => {
    const input = { 
      ...testInput, 
      menu_id: testMenuId, 
      service_option_id: testServiceOptionId,
      guest_count: 15 
    };
    
    const result = await createEventRequest(input);

    // Total price calculation (25.00 * 15 guests = 375.00)
    expect(result.total_price).toEqual(375);
    expect(result.guest_count).toEqual(15);
  });

  it('should throw error when menu does not exist', async () => {
    const input = { ...testInput, menu_id: 999, service_option_id: testServiceOptionId };
    
    await expect(createEventRequest(input)).rejects.toThrow(/menu not found/i);
  });

  it('should throw error when service option does not exist', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: 999 };
    
    await expect(createEventRequest(input)).rejects.toThrow(/service option not found/i);
  });

  it('should throw error when service option does not belong to the menu', async () => {
    // Create another menu and service option
    const anotherMenu = await db.insert(menusTable)
      .values({
        name: 'Another Menu',
        description: 'Another menu for testing'
      })
      .returning()
      .execute();

    const anotherServiceOption = await db.insert(serviceOptionsTable)
      .values({
        menu_id: anotherMenu[0].id,
        service_type: 'buffet',
        price_per_person: '30.00',
        description: 'Buffet service option'
      })
      .returning()
      .execute();

    // Try to use service option from different menu
    const input = { 
      ...testInput, 
      menu_id: testMenuId, 
      service_option_id: anotherServiceOption[0].id 
    };
    
    await expect(createEventRequest(input)).rejects.toThrow(/service option does not belong to the specified menu/i);
  });
});

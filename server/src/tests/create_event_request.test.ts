
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, eventRequestsTable } from '../db/schema';
import { type CreateEventRequestInput } from '../schema';
import { createEventRequest } from '../handlers/create_event_request';
import { eq } from 'drizzle-orm';

describe('createEventRequest', () => {
  let testMenuId: number;
  let testServiceOptionId: number;

  beforeEach(async () => {
    await createDB();

    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();
    testMenuId = menuResult[0].id;

    // Create test service option
    const serviceResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: testMenuId,
        service_type: 'plated',
        price_per_person: '25.00',
        description: 'Plated service option'
      })
      .returning()
      .execute();
    testServiceOptionId = serviceResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateEventRequestInput = {
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1234567890',
    menu_id: 0, // Will be set in tests
    service_option_id: 0, // Will be set in tests
    event_date: new Date('2024-06-15'),
    event_time: '18:00',
    location: '123 Event Street, City, State',
    guest_count: 50,
    special_requests: 'Please ensure vegetarian options',
    dietary_restrictions: 'Gluten-free options needed'
  };

  it('should create event request with calculated total price', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: testServiceOptionId };
    const result = await createEventRequest(input);

    // Basic field validation
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.customer_phone).toEqual('+1234567890');
    expect(result.menu_id).toEqual(testMenuId);
    expect(result.service_option_id).toEqual(testServiceOptionId);
    expect(result.event_date).toEqual(new Date('2024-06-15'));
    expect(result.event_time).toEqual('18:00:00'); // PostgreSQL time format includes seconds
    expect(result.location).toEqual('123 Event Street, City, State');
    expect(result.guest_count).toEqual(50);
    expect(result.special_requests).toEqual('Please ensure vegetarian options');
    expect(result.dietary_restrictions).toEqual('Gluten-free options needed');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Price calculation: 50 guests * $25.00 = $1250.00
    expect(result.total_price).toEqual(1250.00);
    expect(typeof result.total_price).toBe('number');
  });

  it('should include menu and service option details', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: testServiceOptionId };
    const result = await createEventRequest(input);

    // Menu details
    expect(result.menu).toBeDefined();
    expect(result.menu.id).toEqual(testMenuId);
    expect(result.menu.name).toEqual('Test Menu');
    expect(result.menu.description).toEqual('A test menu');
    expect(result.menu.thumbnail_image_url).toEqual('https://example.com/image.jpg');

    // Service option details
    expect(result.service_option).toBeDefined();
    expect(result.service_option.id).toEqual(testServiceOptionId);
    expect(result.service_option.menu_id).toEqual(testMenuId);
    expect(result.service_option.service_type).toEqual('plated');
    expect(result.service_option.price_per_person).toEqual(25.00);
    expect(typeof result.service_option.price_per_person).toBe('number');
    expect(result.service_option.description).toEqual('Plated service option');
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
    expect(eventRequests[0].menu_id).toEqual(testMenuId);
    expect(eventRequests[0].service_option_id).toEqual(testServiceOptionId);
    expect(parseFloat(eventRequests[0].total_price)).toEqual(1250.00);
    expect(eventRequests[0].status).toEqual('pending');
    expect(eventRequests[0].event_date).toEqual('2024-06-15');
    expect(eventRequests[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent menu', async () => {
    const input = { ...testInput, menu_id: 99999, service_option_id: testServiceOptionId };

    expect(createEventRequest(input)).rejects.toThrow(/menu with id 99999 not found/i);
  });

  it('should throw error for non-existent service option', async () => {
    const input = { ...testInput, menu_id: testMenuId, service_option_id: 99999 };

    expect(createEventRequest(input)).rejects.toThrow(/service option with id 99999 not found/i);
  });

  it('should throw error when service option does not belong to menu', async () => {
    // Create another menu and service option
    const anotherMenuResult = await db.insert(menusTable)
      .values({
        name: 'Another Menu',
        description: 'Another test menu'
      })
      .returning()
      .execute();

    const anotherServiceResult = await db.insert(serviceOptionsTable)
      .values({
        menu_id: anotherMenuResult[0].id,
        service_type: 'buffet',
        price_per_person: '20.00'
      })
      .returning()
      .execute();

    const input = { 
      ...testInput, 
      menu_id: testMenuId, 
      service_option_id: anotherServiceResult[0].id 
    };

    expect(createEventRequest(input)).rejects.toThrow(/service option .* does not belong to menu/i);
  });

  it('should handle null optional fields correctly', async () => {
    const inputWithNulls = {
      ...testInput,
      menu_id: testMenuId,
      service_option_id: testServiceOptionId,
      customer_phone: null,
      special_requests: null,
      dietary_restrictions: null
    };

    const result = await createEventRequest(inputWithNulls);

    expect(result.customer_phone).toBeNull();
    expect(result.special_requests).toBeNull();
    expect(result.dietary_restrictions).toBeNull();
    expect(result.total_price).toEqual(1250.00);
  });
});

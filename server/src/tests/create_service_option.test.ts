
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceOptionsTable, menusTable } from '../db/schema';
import { type CreateServiceOptionInput, type CreateMenuInput } from '../schema';
import { createServiceOption } from '../handlers/create_service_option';
import { eq } from 'drizzle-orm';

// Test menu for creating service options
const testMenu: CreateMenuInput = {
  name: 'Test Menu',
  description: 'A menu for testing',
  thumbnail_image_url: 'https://example.com/image.jpg'
};

// Test service option input
const testInput: CreateServiceOptionInput = {
  menu_id: 1, // Will be updated after menu creation
  service_type: 'plated',
  price_per_person: 25.99,
  description: 'Elegant plated service'
};

describe('createServiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service option', async () => {
    // Create prerequisite menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenu.name,
        description: testMenu.description,
        thumbnail_image_url: testMenu.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];
    const input = { ...testInput, menu_id: menu.id };

    const result = await createServiceOption(input);

    // Basic field validation
    expect(result.menu_id).toEqual(menu.id);
    expect(result.service_type).toEqual('plated');
    expect(result.price_per_person).toEqual(25.99);
    expect(typeof result.price_per_person).toBe('number');
    expect(result.description).toEqual('Elegant plated service');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service option to database', async () => {
    // Create prerequisite menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenu.name,
        description: testMenu.description,
        thumbnail_image_url: testMenu.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];
    const input = { ...testInput, menu_id: menu.id };

    const result = await createServiceOption(input);

    // Query database to verify storage
    const serviceOptions = await db.select()
      .from(serviceOptionsTable)
      .where(eq(serviceOptionsTable.id, result.id))
      .execute();

    expect(serviceOptions).toHaveLength(1);
    expect(serviceOptions[0].menu_id).toEqual(menu.id);
    expect(serviceOptions[0].service_type).toEqual('plated');
    expect(parseFloat(serviceOptions[0].price_per_person)).toEqual(25.99);
    expect(serviceOptions[0].description).toEqual('Elegant plated service');
    expect(serviceOptions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create service option with different service types', async () => {
    // Create prerequisite menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenu.name,
        description: testMenu.description,
        thumbnail_image_url: testMenu.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    // Test buffet service
    const buffetInput: CreateServiceOptionInput = {
      menu_id: menu.id,
      service_type: 'buffet',
      price_per_person: 18.50,
      description: 'Self-serve buffet style'
    };

    const buffetResult = await createServiceOption(buffetInput);
    expect(buffetResult.service_type).toEqual('buffet');
    expect(buffetResult.price_per_person).toEqual(18.50);

    // Test cook-along service
    const cookAlongInput: CreateServiceOptionInput = {
      menu_id: menu.id,
      service_type: 'cook-along',
      price_per_person: 35.00,
      description: 'Interactive cooking experience'
    };

    const cookAlongResult = await createServiceOption(cookAlongInput);
    expect(cookAlongResult.service_type).toEqual('cook-along');
    expect(cookAlongResult.price_per_person).toEqual(35.00);
  });

  it('should create service option with null description', async () => {
    // Create prerequisite menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenu.name,
        description: testMenu.description,
        thumbnail_image_url: testMenu.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    const inputWithNullDescription: CreateServiceOptionInput = {
      menu_id: menu.id,
      service_type: 'buffet',
      price_per_person: 20.00,
      description: null
    };

    const result = await createServiceOption(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.menu_id).toEqual(menu.id);
    expect(result.service_type).toEqual('buffet');
    expect(result.price_per_person).toEqual(20.00);
  });

  it('should throw error when menu does not exist', async () => {
    const invalidInput: CreateServiceOptionInput = {
      menu_id: 999, // Non-existent menu ID
      service_type: 'plated',
      price_per_person: 25.99,
      description: 'Should fail'
    };

    await expect(createServiceOption(invalidInput)).rejects.toThrow(/menu not found/i);
  });
});

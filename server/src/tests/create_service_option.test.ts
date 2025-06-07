
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceOptionsTable, menusTable } from '../db/schema';
import { type CreateServiceOptionInput, type CreateMenuInput } from '../schema';
import { createServiceOption } from '../handlers/create_service_option';
import { eq } from 'drizzle-orm';

// Test input for creating a menu first
const testMenuInput: CreateMenuInput = {
  name: 'Test Menu',
  description: 'A menu for testing',
  thumbnail_image_url: 'https://example.com/image.jpg'
};

// Test input for service option
const testInput: CreateServiceOptionInput = {
  menu_id: 1, // Will be set after creating menu
  service_type: 'plated',
  price_per_person: 25.50,
  description: 'Elegant plated service'
};

describe('createServiceOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service option', async () => {
    // Create prerequisite menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenuInput.name,
        description: testMenuInput.description,
        thumbnail_image_url: testMenuInput.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];
    const serviceOptionInput = { ...testInput, menu_id: menu.id };

    const result = await createServiceOption(serviceOptionInput);

    // Basic field validation
    expect(result.menu_id).toEqual(menu.id);
    expect(result.service_type).toEqual('plated');
    expect(result.price_per_person).toEqual(25.50);
    expect(typeof result.price_per_person).toBe('number');
    expect(result.description).toEqual('Elegant plated service');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service option to database', async () => {
    // Create prerequisite menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenuInput.name,
        description: testMenuInput.description,
        thumbnail_image_url: testMenuInput.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];
    const serviceOptionInput = { ...testInput, menu_id: menu.id };

    const result = await createServiceOption(serviceOptionInput);

    // Query using proper drizzle syntax
    const serviceOptions = await db.select()
      .from(serviceOptionsTable)
      .where(eq(serviceOptionsTable.id, result.id))
      .execute();

    expect(serviceOptions).toHaveLength(1);
    expect(serviceOptions[0].menu_id).toEqual(menu.id);
    expect(serviceOptions[0].service_type).toEqual('plated');
    expect(parseFloat(serviceOptions[0].price_per_person)).toEqual(25.50);
    expect(serviceOptions[0].description).toEqual('Elegant plated service');
    expect(serviceOptions[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different service types', async () => {
    // Create prerequisite menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenuInput.name,
        description: testMenuInput.description,
        thumbnail_image_url: testMenuInput.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];

    const buffetInput = {
      ...testInput,
      menu_id: menu.id,
      service_type: 'buffet' as const,
      price_per_person: 18.75,
      description: 'Self-serve buffet style'
    };

    const result = await createServiceOption(buffetInput);

    expect(result.service_type).toEqual('buffet');
    expect(result.price_per_person).toEqual(18.75);
    expect(result.description).toEqual('Self-serve buffet style');
  });

  it('should throw error when menu does not exist', async () => {
    const invalidInput = { ...testInput, menu_id: 999 };

    await expect(createServiceOption(invalidInput)).rejects.toThrow(/menu not found/i);
  });

  it('should handle null description', async () => {
    // Create prerequisite menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: testMenuInput.name,
        description: testMenuInput.description,
        thumbnail_image_url: testMenuInput.thumbnail_image_url
      })
      .returning()
      .execute();

    const menu = menuResult[0];
    const serviceOptionInput = {
      ...testInput,
      menu_id: menu.id,
      description: null
    };

    const result = await createServiceOption(serviceOptionInput);

    expect(result.description).toBeNull();
  });
});

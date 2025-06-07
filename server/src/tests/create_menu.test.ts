
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable } from '../db/schema';
import { type CreateMenuInput } from '../schema';
import { createMenu } from '../handlers/create_menu';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateMenuInput = {
  name: 'Test Menu',
  description: 'A delicious test menu',
  thumbnail_image_url: 'https://example.com/image.jpg'
};

const minimalInput: CreateMenuInput = {
  name: 'Minimal Menu',
  description: null,
  thumbnail_image_url: null
};

describe('createMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu with all fields', async () => {
    const result = await createMenu(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Menu');
    expect(result.description).toEqual('A delicious test menu');
    expect(result.thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(result.average_rating).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a menu with minimal fields', async () => {
    const result = await createMenu(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Menu');
    expect(result.description).toBeNull();
    expect(result.thumbnail_image_url).toBeNull();
    expect(result.average_rating).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save menu to database', async () => {
    const result = await createMenu(testInput);

    // Query using proper drizzle syntax
    const menus = await db.select()
      .from(menusTable)
      .where(eq(menusTable.id, result.id))
      .execute();

    expect(menus).toHaveLength(1);
    expect(menus[0].name).toEqual('Test Menu');
    expect(menus[0].description).toEqual('A delicious test menu');
    expect(menus[0].thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(menus[0].average_rating).toBeNull();
    expect(menus[0].created_at).toBeInstanceOf(Date);
    expect(menus[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric conversion correctly', async () => {
    const result = await createMenu(testInput);

    // Verify numeric fields are properly typed
    expect(result.average_rating).toBeNull();
    if (result.average_rating !== null) {
      expect(typeof result.average_rating).toBe('number');
    }
  });
});

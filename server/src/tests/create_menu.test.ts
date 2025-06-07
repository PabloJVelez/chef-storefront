
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable } from '../db/schema';
import { type CreateMenuInput } from '../schema';
import { createMenu } from '../handlers/create_menu';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMenuInput = {
  name: 'Mediterranean Feast',
  description: 'A delicious Mediterranean menu with fresh ingredients',
  thumbnail_image_url: 'https://example.com/image.jpg'
};

// Test input with nullable fields
const minimalInput: CreateMenuInput = {
  name: 'Simple Menu',
  description: null,
  thumbnail_image_url: null
};

describe('createMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu with all fields', async () => {
    const result = await createMenu(testInput);

    // Basic field validation
    expect(result.name).toEqual('Mediterranean Feast');
    expect(result.description).toEqual('A delicious Mediterranean menu with fresh ingredients');
    expect(result.thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(result.average_rating).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a menu with minimal fields', async () => {
    const result = await createMenu(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Simple Menu');
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
    expect(menus[0].name).toEqual('Mediterranean Feast');
    expect(menus[0].description).toEqual('A delicious Mediterranean menu with fresh ingredients');
    expect(menus[0].thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(menus[0].average_rating).toBeNull();
    expect(menus[0].created_at).toBeInstanceOf(Date);
    expect(menus[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric conversion for average_rating', async () => {
    const result = await createMenu(testInput);

    // Verify that average_rating is properly typed as number | null
    expect(result.average_rating).toBeNull();
    expect(typeof result.average_rating === 'object' || typeof result.average_rating === 'number').toBe(true);
  });
});

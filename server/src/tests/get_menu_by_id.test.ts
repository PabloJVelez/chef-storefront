
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable, reviewsTable } from '../db/schema';
import { getMenuById } from '../handlers/get_menu_by_id';

describe('getMenuById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return menu with service options and reviews', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/thumb.jpg',
        average_rating: '4.5'
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    // Create service options
    await db.insert(serviceOptionsTable)
      .values([
        {
          menu_id: menuId,
          service_type: 'plated',
          price_per_person: '25.99',
          description: 'Plated service'
        },
        {
          menu_id: menuId,
          service_type: 'buffet',
          price_per_person: '19.99',
          description: 'Buffet service'
        }
      ])
      .execute();

    // Create reviews
    await db.insert(reviewsTable)
      .values([
        {
          menu_id: menuId,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          rating: 5,
          comment: 'Excellent!'
        },
        {
          menu_id: menuId,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          rating: 4,
          comment: 'Very good'
        }
      ])
      .execute();

    // Test the handler
    const result = await getMenuById(menuId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(menuId);
    expect(result!.name).toBe('Test Menu');
    expect(result!.description).toBe('A test menu');
    expect(result!.thumbnail_image_url).toBe('https://example.com/thumb.jpg');
    expect(result!.average_rating).toBe(4.5);
    expect(typeof result!.average_rating).toBe('number');

    // Check service options
    expect(result!.service_options).toHaveLength(2);
    expect(result!.service_options[0].price_per_person).toBe(25.99);
    expect(result!.service_options[1].price_per_person).toBe(19.99);
    expect(typeof result!.service_options[0].price_per_person).toBe('number');

    // Check reviews
    expect(result!.reviews).toHaveLength(2);
    expect(result!.reviews[0].customer_name).toBe('John Doe');
    expect(result!.reviews[0].rating).toBe(5);
    expect(result!.reviews[1].customer_name).toBe('Jane Smith');
    expect(result!.reviews[1].rating).toBe(4);

    // Check min price calculation
    expect(result!.min_price).toBe(19.99);
    expect(typeof result!.min_price).toBe('number');
  });

  it('should return null for non-existent menu', async () => {
    const result = await getMenuById(999);
    expect(result).toBeNull();
  });

  it('should handle menu with no service options or reviews', async () => {
    // Create menu without service options or reviews
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Empty Menu',
        description: 'Menu with no options',
        thumbnail_image_url: null,
        average_rating: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    const result = await getMenuById(menuId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(menuId);
    expect(result!.name).toBe('Empty Menu');
    expect(result!.average_rating).toBeNull();
    expect(result!.service_options).toHaveLength(0);
    expect(result!.reviews).toHaveLength(0);
    expect(result!.min_price).toBeNull();
  });

  it('should handle menu with service options but no reviews', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Menu with Options',
        description: 'Has service options only',
        thumbnail_image_url: null,
        average_rating: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    // Create service option
    await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuId,
        service_type: 'cook-along',
        price_per_person: '35.00',
        description: 'Cook-along experience'
      })
      .execute();

    const result = await getMenuById(menuId);

    expect(result).not.toBeNull();
    expect(result!.service_options).toHaveLength(1);
    expect(result!.service_options[0].price_per_person).toBe(35.00);
    expect(result!.reviews).toHaveLength(0);
    expect(result!.min_price).toBe(35.00);
  });
});

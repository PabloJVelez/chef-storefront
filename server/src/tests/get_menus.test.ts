
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable } from '../db/schema';
import { getMenus } from '../handlers/get_menus';

describe('getMenus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no menus exist', async () => {
    const result = await getMenus();
    expect(result).toEqual([]);
  });

  it('should return menu without service options', async () => {
    // Create a menu without service options
    await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg',
        average_rating: '4.5'
      })
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Menu');
    expect(result[0].description).toEqual('A test menu');
    expect(result[0].thumbnail_image_url).toEqual('https://example.com/image.jpg');
    expect(result[0].average_rating).toEqual(4.5);
    expect(result[0].service_options).toEqual([]);
    expect(result[0].min_price).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return menu with service options and calculate min_price', async () => {
    // Create a menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Deluxe Menu',
        description: 'Our premium menu',
        thumbnail_image_url: null,
        average_rating: null
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
          price_per_person: '50.00',
          description: 'Plated service'
        },
        {
          menu_id: menuId,
          service_type: 'buffet',
          price_per_person: '35.00',
          description: 'Buffet style'
        },
        {
          menu_id: menuId,
          service_type: 'cook-along',
          price_per_person: '75.00',
          description: null
        }
      ])
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(1);
    const menu = result[0];
    
    expect(menu.name).toEqual('Deluxe Menu');
    expect(menu.description).toEqual('Our premium menu');
    expect(menu.thumbnail_image_url).toBeNull();
    expect(menu.average_rating).toBeNull();
    expect(menu.service_options).toHaveLength(3);
    expect(menu.min_price).toEqual(35.00);

    // Check service options
    const serviceOptions = menu.service_options;
    expect(serviceOptions.find(opt => opt.service_type === 'plated')?.price_per_person).toEqual(50.00);
    expect(serviceOptions.find(opt => opt.service_type === 'buffet')?.price_per_person).toEqual(35.00);
    expect(serviceOptions.find(opt => opt.service_type === 'cook-along')?.price_per_person).toEqual(75.00);
  });

  it('should return multiple menus correctly', async () => {
    // Create two menus
    const menu1Result = await db.insert(menusTable)
      .values({
        name: 'Menu 1',
        description: 'First menu',
        thumbnail_image_url: null,
        average_rating: '4.2'
      })
      .returning()
      .execute();

    const menu2Result = await db.insert(menusTable)
      .values({
        name: 'Menu 2',
        description: 'Second menu',
        thumbnail_image_url: 'https://example.com/menu2.jpg',
        average_rating: null
      })
      .returning()
      .execute();

    // Add service option to first menu only
    await db.insert(serviceOptionsTable)
      .values({
        menu_id: menu1Result[0].id,
        service_type: 'plated',
        price_per_person: '45.00',
        description: 'Plated service'
      })
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(2);
    
    const firstMenu = result.find(m => m.name === 'Menu 1');
    const secondMenu = result.find(m => m.name === 'Menu 2');

    expect(firstMenu).toBeDefined();
    expect(firstMenu!.service_options).toHaveLength(1);
    expect(firstMenu!.min_price).toEqual(45.00);
    expect(firstMenu!.average_rating).toEqual(4.2);

    expect(secondMenu).toBeDefined();
    expect(secondMenu!.service_options).toHaveLength(0);
    expect(secondMenu!.min_price).toBeNull();
    expect(secondMenu!.average_rating).toBeNull();
    expect(secondMenu!.thumbnail_image_url).toEqual('https://example.com/menu2.jpg');
  });

  it('should handle numeric conversions correctly', async () => {
    // Create menu with precise decimal values
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'Testing numeric conversion',
        thumbnail_image_url: null,
        average_rating: '3.75'
      })
      .returning()
      .execute();

    await db.insert(serviceOptionsTable)
      .values({
        menu_id: menuResult[0].id,
        service_type: 'buffet',
        price_per_person: '29.99',
        description: 'Test service'
      })
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(1);
    expect(typeof result[0].average_rating).toBe('number');
    expect(result[0].average_rating).toEqual(3.75);
    expect(typeof result[0].service_options[0].price_per_person).toBe('number');
    expect(result[0].service_options[0].price_per_person).toEqual(29.99);
    expect(typeof result[0].min_price).toBe('number');
    expect(result[0].min_price).toEqual(29.99);
  });
});

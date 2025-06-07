
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

  it('should return menus with service options and min prices', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Italian Feast',
        description: 'Authentic Italian cuisine',
        thumbnail_image_url: 'https://example.com/italian.jpg',
        average_rating: '4.5'
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    // Create service options with different prices
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
        },
        {
          menu_id: menuId,
          service_type: 'cook-along',
          price_per_person: '35.00',
          description: 'Interactive cooking experience'
        }
      ])
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(1);
    
    const menu = result[0];
    expect(menu.name).toEqual('Italian Feast');
    expect(menu.description).toEqual('Authentic Italian cuisine');
    expect(menu.thumbnail_image_url).toEqual('https://example.com/italian.jpg');
    expect(menu.average_rating).toEqual(4.5);
    expect(typeof menu.average_rating).toBe('number');
    expect(menu.service_options).toHaveLength(3);
    expect(menu.min_price).toEqual(19.99);
    expect(typeof menu.min_price).toBe('number');

    // Verify service options are properly converted
    menu.service_options.forEach(option => {
      expect(typeof option.price_per_person).toBe('number');
      expect(option.menu_id).toEqual(menuId);
    });

    // Check specific service option prices
    const buffetOption = menu.service_options.find(opt => opt.service_type === 'buffet');
    expect(buffetOption?.price_per_person).toEqual(19.99);
  });

  it('should return multiple menus sorted by name', async () => {
    // Create multiple menus
    await db.insert(menusTable)
      .values([
        {
          name: 'Zebra Cuisine',
          description: 'Last in alphabet',
          average_rating: '3.0'
        },
        {
          name: 'Asian Fusion',
          description: 'First in alphabet',
          average_rating: '4.8'
        },
        {
          name: 'Mexican Fiesta',
          description: 'Middle in alphabet',
          average_rating: null
        }
      ])
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Asian Fusion');
    expect(result[1].name).toEqual('Mexican Fiesta');
    expect(result[2].name).toEqual('Zebra Cuisine');

    // Verify numeric conversions and null handling
    expect(result[0].average_rating).toEqual(4.8);
    expect(result[1].average_rating).toBeNull();
    expect(result[2].average_rating).toEqual(3.0);
  });

  it('should handle menu without service options', async () => {
    await db.insert(menusTable)
      .values({
        name: 'Menu Without Options',
        description: 'No service options available',
        average_rating: null
      })
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(1);
    expect(result[0].service_options).toEqual([]);
    expect(result[0].min_price).toBeNull();
    expect(result[0].average_rating).toBeNull();
  });

  it('should correctly calculate min price for each menu', async () => {
    // Create two menus
    const menuResults = await db.insert(menusTable)
      .values([
        { name: 'Expensive Menu', description: 'High-end options' },
        { name: 'Budget Menu', description: 'Affordable options' }
      ])
      .returning()
      .execute();

    const expensiveMenuId = menuResults[0].id;
    const budgetMenuId = menuResults[1].id;

    // Create service options for each menu
    await db.insert(serviceOptionsTable)
      .values([
        // Expensive menu options
        { menu_id: expensiveMenuId, service_type: 'plated', price_per_person: '50.00' },
        { menu_id: expensiveMenuId, service_type: 'buffet', price_per_person: '40.00' },
        // Budget menu options
        { menu_id: budgetMenuId, service_type: 'plated', price_per_person: '15.00' },
        { menu_id: budgetMenuId, service_type: 'buffet', price_per_person: '12.50' }
      ])
      .execute();

    const result = await getMenus();

    expect(result).toHaveLength(2);
    
    const budgetMenu = result.find(m => m.name === 'Budget Menu');
    const expensiveMenu = result.find(m => m.name === 'Expensive Menu');

    expect(budgetMenu?.min_price).toEqual(12.5);
    expect(expensiveMenu?.min_price).toEqual(40.0);
  });
});

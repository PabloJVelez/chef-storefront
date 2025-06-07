
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable } from '../db/schema';
import { getServiceOptionsByMenu } from '../handlers/get_service_options_by_menu';

describe('getServiceOptionsByMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service options for a specific menu', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Italian Feast',
        description: 'Authentic Italian cuisine'
      })
      .returning()
      .execute();
    
    const menuId = menuResult[0].id;

    // Create test service options
    await db.insert(serviceOptionsTable)
      .values([
        {
          menu_id: menuId,
          service_type: 'plated',
          price_per_person: '45.99',
          description: 'Plated service option'
        },
        {
          menu_id: menuId,
          service_type: 'buffet',
          price_per_person: '35.50',
          description: 'Buffet service option'
        }
      ])
      .execute();

    const results = await getServiceOptionsByMenu(menuId);

    expect(results).toHaveLength(2);
    
    // Check first service option
    const platedOption = results.find(opt => opt.service_type === 'plated');
    expect(platedOption).toBeDefined();
    expect(platedOption!.menu_id).toEqual(menuId);
    expect(platedOption!.price_per_person).toEqual(45.99);
    expect(typeof platedOption!.price_per_person).toBe('number');
    expect(platedOption!.description).toEqual('Plated service option');
    expect(platedOption!.created_at).toBeInstanceOf(Date);

    // Check second service option
    const buffetOption = results.find(opt => opt.service_type === 'buffet');
    expect(buffetOption).toBeDefined();
    expect(buffetOption!.menu_id).toEqual(menuId);
    expect(buffetOption!.price_per_person).toEqual(35.50);
    expect(typeof buffetOption!.price_per_person).toBe('number');
    expect(buffetOption!.description).toEqual('Buffet service option');
  });

  it('should return empty array for menu with no service options', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Empty Menu',
        description: 'Menu with no service options'
      })
      .returning()
      .execute();
    
    const menuId = menuResult[0].id;

    const results = await getServiceOptionsByMenu(menuId);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for non-existent menu', async () => {
    const results = await getServiceOptionsByMenu(999);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should only return service options for the specified menu', async () => {
    // Create two test menus
    const menuResults = await db.insert(menusTable)
      .values([
        { name: 'Menu 1', description: 'First menu' },
        { name: 'Menu 2', description: 'Second menu' }
      ])
      .returning()
      .execute();
    
    const menu1Id = menuResults[0].id;
    const menu2Id = menuResults[1].id;

    // Create service options for both menus
    await db.insert(serviceOptionsTable)
      .values([
        {
          menu_id: menu1Id,
          service_type: 'plated',
          price_per_person: '30.00',
          description: 'Menu 1 plated'
        },
        {
          menu_id: menu2Id,
          service_type: 'buffet',
          price_per_person: '25.00',
          description: 'Menu 2 buffet'
        },
        {
          menu_id: menu1Id,
          service_type: 'cook-along',
          price_per_person: '40.00',
          description: 'Menu 1 cook-along'
        }
      ])
      .execute();

    const results = await getServiceOptionsByMenu(menu1Id);

    expect(results).toHaveLength(2);
    results.forEach(option => {
      expect(option.menu_id).toEqual(menu1Id);
    });

    // Verify service types for menu 1
    const serviceTypes = results.map(opt => opt.service_type).sort();
    expect(serviceTypes).toEqual(['cook-along', 'plated']);
  });
});

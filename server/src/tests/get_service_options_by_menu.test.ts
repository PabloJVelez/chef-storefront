
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, serviceOptionsTable } from '../db/schema';
import { type CreateMenuInput, type CreateServiceOptionInput } from '../schema';
import { getServiceOptionsByMenu } from '../handlers/get_service_options_by_menu';

describe('getServiceOptionsByMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service options for a menu', async () => {
    // Create a menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    // Create service options for the menu
    await db.insert(serviceOptionsTable)
      .values([
        {
          menu_id: menuId,
          service_type: 'plated',
          price_per_person: '25.99',
          description: 'Plated service option'
        },
        {
          menu_id: menuId,
          service_type: 'buffet',
          price_per_person: '19.99',
          description: 'Buffet service option'
        }
      ])
      .execute();

    const result = await getServiceOptionsByMenu(menuId);

    expect(result).toHaveLength(2);
    
    // Check first service option
    const platedOption = result.find(opt => opt.service_type === 'plated');
    expect(platedOption).toBeDefined();
    expect(platedOption!.menu_id).toEqual(menuId);
    expect(platedOption!.price_per_person).toEqual(25.99);
    expect(typeof platedOption!.price_per_person).toBe('number');
    expect(platedOption!.description).toEqual('Plated service option');
    expect(platedOption!.id).toBeDefined();
    expect(platedOption!.created_at).toBeInstanceOf(Date);

    // Check second service option
    const buffetOption = result.find(opt => opt.service_type === 'buffet');
    expect(buffetOption).toBeDefined();
    expect(buffetOption!.menu_id).toEqual(menuId);
    expect(buffetOption!.price_per_person).toEqual(19.99);
    expect(typeof buffetOption!.price_per_person).toBe('number');
    expect(buffetOption!.description).toEqual('Buffet service option');
  });

  it('should return empty array for menu with no service options', async () => {
    // Create a menu without service options
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Empty Menu',
        description: 'A menu without service options',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    const result = await getServiceOptionsByMenu(menuId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent menu', async () => {
    const result = await getServiceOptionsByMenu(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return service options for the specified menu', async () => {
    // Create two menus
    const menu1Result = await db.insert(menusTable)
      .values({
        name: 'Menu 1',
        description: 'First menu',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menu2Result = await db.insert(menusTable)
      .values({
        name: 'Menu 2',
        description: 'Second menu',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menu1Id = menu1Result[0].id;
    const menu2Id = menu2Result[0].id;

    // Create service options for both menus
    await db.insert(serviceOptionsTable)
      .values([
        {
          menu_id: menu1Id,
          service_type: 'plated',
          price_per_person: '30.00',
          description: 'Menu 1 plated option'
        },
        {
          menu_id: menu2Id,
          service_type: 'buffet',
          price_per_person: '20.00',
          description: 'Menu 2 buffet option'
        },
        {
          menu_id: menu1Id,
          service_type: 'cook-along',
          price_per_person: '35.00',
          description: 'Menu 1 cook-along option'
        }
      ])
      .execute();

    const result = await getServiceOptionsByMenu(menu1Id);

    expect(result).toHaveLength(2);
    result.forEach(option => {
      expect(option.menu_id).toEqual(menu1Id);
    });

    // Verify service types for menu 1
    const serviceTypes = result.map(opt => opt.service_type);
    expect(serviceTypes).toContain('plated');
    expect(serviceTypes).toContain('cook-along');
    expect(serviceTypes).not.toContain('buffet');
  });
});

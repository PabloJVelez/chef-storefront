
import { db } from '../db';
import { menusTable, serviceOptionsTable } from '../db/schema';
import { type MenuWithServiceOptions } from '../schema';
import { eq, min } from 'drizzle-orm';

export const getMenus = async (): Promise<MenuWithServiceOptions[]> => {
  try {
    // Get all menus with their service options
    const menusWithOptions = await db.select()
      .from(menusTable)
      .leftJoin(serviceOptionsTable, eq(menusTable.id, serviceOptionsTable.menu_id))
      .execute();

    // Group service options by menu
    const menuMap = new Map<number, MenuWithServiceOptions>();

    for (const result of menusWithOptions) {
      const menu = result.menus;
      const serviceOption = result.service_options;

      if (!menuMap.has(menu.id)) {
        menuMap.set(menu.id, {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          thumbnail_image_url: menu.thumbnail_image_url,
          average_rating: menu.average_rating ? parseFloat(menu.average_rating) : null,
          created_at: menu.created_at,
          updated_at: menu.updated_at,
          service_options: [],
          min_price: null
        });
      }

      const menuWithOptions = menuMap.get(menu.id)!;

      // Add service option if it exists
      if (serviceOption) {
        menuWithOptions.service_options.push({
          id: serviceOption.id,
          menu_id: serviceOption.menu_id,
          service_type: serviceOption.service_type,
          price_per_person: parseFloat(serviceOption.price_per_person),
          description: serviceOption.description,
          created_at: serviceOption.created_at
        });
      }
    }

    // Calculate min_price for each menu
    const menus = Array.from(menuMap.values());
    for (const menu of menus) {
      if (menu.service_options.length > 0) {
        menu.min_price = Math.min(...menu.service_options.map(option => option.price_per_person));
      }
    }

    return menus;
  } catch (error) {
    console.error('Get menus failed:', error);
    throw error;
  }
};

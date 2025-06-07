
import { db } from '../db';
import { menusTable, serviceOptionsTable } from '../db/schema';
import { type MenuWithServiceOptions } from '../schema';
import { eq, asc, min } from 'drizzle-orm';

export const getMenus = async (): Promise<MenuWithServiceOptions[]> => {
  try {
    // Get all menus
    const menus = await db.select()
      .from(menusTable)
      .orderBy(asc(menusTable.name))
      .execute();

    // Get all service options
    const serviceOptions = await db.select()
      .from(serviceOptionsTable)
      .orderBy(asc(serviceOptionsTable.service_type))
      .execute();

    // Get minimum price for each menu
    const minPrices = await db.select({
      menu_id: serviceOptionsTable.menu_id,
      min_price: min(serviceOptionsTable.price_per_person)
    })
      .from(serviceOptionsTable)
      .groupBy(serviceOptionsTable.menu_id)
      .execute();

    // Create a map for quick lookup
    const serviceOptionsByMenu = new Map<number, any[]>();
    const minPricesByMenu = new Map<number, number>();

    // Group service options by menu_id
    serviceOptions.forEach(option => {
      if (!serviceOptionsByMenu.has(option.menu_id)) {
        serviceOptionsByMenu.set(option.menu_id, []);
      }
      serviceOptionsByMenu.get(option.menu_id)!.push({
        ...option,
        price_per_person: parseFloat(option.price_per_person) // Convert numeric to number
      });
    });

    // Map minimum prices by menu_id
    minPrices.forEach(({ menu_id, min_price }) => {
      if (min_price !== null) {
        minPricesByMenu.set(menu_id, parseFloat(min_price));
      }
    });

    // Combine menus with their service options and min prices
    return menus.map(menu => ({
      ...menu,
      average_rating: menu.average_rating ? parseFloat(menu.average_rating) : null, // Convert numeric to number
      service_options: serviceOptionsByMenu.get(menu.id) || [],
      min_price: minPricesByMenu.get(menu.id) || null
    }));
  } catch (error) {
    console.error('Failed to get menus:', error);
    throw error;
  }
};

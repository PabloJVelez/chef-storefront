
import { db } from '../db';
import { menusTable, serviceOptionsTable, reviewsTable } from '../db/schema';
import { type MenuWithReviews } from '../schema';
import { eq } from 'drizzle-orm';

export const getMenuById = async (id: number): Promise<MenuWithReviews | null> => {
  try {
    // First get the menu
    const menus = await db.select()
      .from(menusTable)
      .where(eq(menusTable.id, id))
      .execute();

    if (menus.length === 0) {
      return null;
    }

    const menu = menus[0];

    // Get service options for this menu
    const serviceOptions = await db.select()
      .from(serviceOptionsTable)
      .where(eq(serviceOptionsTable.menu_id, id))
      .execute();

    // Get reviews for this menu
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.menu_id, id))
      .execute();

    // Calculate min price from service options
    const minPrice = serviceOptions.length > 0 
      ? Math.min(...serviceOptions.map(option => parseFloat(option.price_per_person)))
      : null;

    // Convert numeric fields and build response
    return {
      ...menu,
      average_rating: menu.average_rating ? parseFloat(menu.average_rating) : null,
      service_options: serviceOptions.map(option => ({
        ...option,
        price_per_person: parseFloat(option.price_per_person)
      })),
      reviews: reviews,
      min_price: minPrice
    };
  } catch (error) {
    console.error('Get menu by ID failed:', error);
    throw error;
  }
};

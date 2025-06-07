
import { db } from '../db';
import { menusTable } from '../db/schema';
import { type CreateMenuInput, type Menu } from '../schema';

export const createMenu = async (input: CreateMenuInput): Promise<Menu> => {
  try {
    // Insert menu record
    const result = await db.insert(menusTable)
      .values({
        name: input.name,
        description: input.description,
        thumbnail_image_url: input.thumbnail_image_url
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const menu = result[0];
    return {
      ...menu,
      average_rating: menu.average_rating ? parseFloat(menu.average_rating) : null
    };
  } catch (error) {
    console.error('Menu creation failed:', error);
    throw error;
  }
};

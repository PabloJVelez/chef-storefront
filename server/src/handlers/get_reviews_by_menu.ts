
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const getReviewsByMenu = async (menuId: number): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.menu_id, menuId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get reviews by menu failed:', error);
    throw error;
  }
};

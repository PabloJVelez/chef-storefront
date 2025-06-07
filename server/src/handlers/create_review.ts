
import { db } from '../db';
import { reviewsTable, menusTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    // Verify that the menu exists
    const menu = await db.select()
      .from(menusTable)
      .where(eq(menusTable.id, input.menu_id))
      .execute();

    if (menu.length === 0) {
      throw new Error(`Menu with id ${input.menu_id} not found`);
    }

    // Insert review record
    const result = await db.insert(reviewsTable)
      .values({
        menu_id: input.menu_id,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        rating: input.rating,
        comment: input.comment
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
};

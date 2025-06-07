
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, menusTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

describe('createReview', () => {
  let testMenuId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A menu for testing',
        thumbnail_image_url: null,
        average_rating: null
      })
      .returning()
      .execute();
    
    testMenuId = menuResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateReviewInput = {
    menu_id: 0, // Will be set in test
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    rating: 5,
    comment: 'Amazing food and service!'
  };

  it('should create a review', async () => {
    const input = { ...testInput, menu_id: testMenuId };
    const result = await createReview(input);

    // Basic field validation
    expect(result.menu_id).toEqual(testMenuId);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.rating).toEqual(5);
    expect(result.comment).toEqual('Amazing food and service!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    const input = { ...testInput, menu_id: testMenuId };
    const result = await createReview(input);

    // Query using proper drizzle syntax
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].menu_id).toEqual(testMenuId);
    expect(reviews[0].customer_name).toEqual('John Doe');
    expect(reviews[0].customer_email).toEqual('john@example.com');
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].comment).toEqual('Amazing food and service!');
    expect(reviews[0].created_at).toBeInstanceOf(Date);
  });

  it('should create review with null comment', async () => {
    const input = { ...testInput, menu_id: testMenuId, comment: null };
    const result = await createReview(input);

    expect(result.comment).toBeNull();
    expect(result.rating).toEqual(5);
    expect(result.customer_name).toEqual('John Doe');
  });

  it('should create review with minimum rating', async () => {
    const input = { ...testInput, menu_id: testMenuId, rating: 1 };
    const result = await createReview(input);

    expect(result.rating).toEqual(1);
    expect(result.menu_id).toEqual(testMenuId);
  });

  it('should create review with maximum rating', async () => {
    const input = { ...testInput, menu_id: testMenuId, rating: 5 };
    const result = await createReview(input);

    expect(result.rating).toEqual(5);
    expect(result.menu_id).toEqual(testMenuId);
  });

  it('should reject review for non-existent menu', async () => {
    const input = { ...testInput, menu_id: 99999 };
    
    await expect(createReview(input)).rejects.toThrow(/menu.*not found/i);
  });

  it('should handle multiple reviews for same menu', async () => {
    const input1 = { ...testInput, menu_id: testMenuId, customer_name: 'Customer 1' };
    const input2 = { ...testInput, menu_id: testMenuId, customer_name: 'Customer 2', rating: 3 };

    const result1 = await createReview(input1);
    const result2 = await createReview(input2);

    expect(result1.customer_name).toEqual('Customer 1');
    expect(result1.rating).toEqual(5);
    expect(result2.customer_name).toEqual('Customer 2');
    expect(result2.rating).toEqual(3);
    expect(result1.menu_id).toEqual(result2.menu_id);
  });
});

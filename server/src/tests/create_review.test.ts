
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, menusTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

describe('createReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let menuId: number;

  beforeEach(async () => {
    // Create a test menu first
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: 'https://example.com/image.jpg'
      })
      .returning()
      .execute();

    menuId = menuResult[0].id;
  });

  const testInput: CreateReviewInput = {
    menu_id: 0, // Will be set in tests
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    rating: 5,
    comment: 'Great food and service!'
  };

  it('should create a review', async () => {
    const input = { ...testInput, menu_id: menuId };
    const result = await createReview(input);

    expect(result.menu_id).toEqual(menuId);
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.rating).toEqual(5);
    expect(result.comment).toEqual('Great food and service!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    const input = { ...testInput, menu_id: menuId };
    const result = await createReview(input);

    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].menu_id).toEqual(menuId);
    expect(reviews[0].customer_name).toEqual('John Doe');
    expect(reviews[0].customer_email).toEqual('john@example.com');
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].comment).toEqual('Great food and service!');
    expect(reviews[0].created_at).toBeInstanceOf(Date);
  });

  it('should create review with null comment', async () => {
    const input = { ...testInput, menu_id: menuId, comment: null };
    const result = await createReview(input);

    expect(result.comment).toBeNull();
    expect(result.rating).toEqual(5);
    expect(result.customer_name).toEqual('John Doe');
  });

  it('should throw error for non-existent menu', async () => {
    const input = { ...testInput, menu_id: 99999 };

    await expect(createReview(input)).rejects.toThrow(/Menu with id 99999 not found/i);
  });

  it('should handle different rating values', async () => {
    const input1 = { ...testInput, menu_id: menuId, rating: 1 };
    const result1 = await createReview(input1);
    expect(result1.rating).toEqual(1);

    const input5 = { ...testInput, menu_id: menuId, rating: 5 };
    const result5 = await createReview(input5);
    expect(result5.rating).toEqual(5);
  });

  it('should store customer information correctly', async () => {
    const input = {
      ...testInput,
      menu_id: menuId,
      customer_name: 'Jane Smith',
      customer_email: 'jane.smith@example.com'
    };

    const result = await createReview(input);

    expect(result.customer_name).toEqual('Jane Smith');
    expect(result.customer_email).toEqual('jane.smith@example.com');
  });
});

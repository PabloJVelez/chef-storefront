
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, reviewsTable } from '../db/schema';
import { getReviewsByMenu } from '../handlers/get_reviews_by_menu';

describe('getReviewsByMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return reviews for a specific menu', async () => {
    // Create a test menu
    const [menu] = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu'
      })
      .returning()
      .execute();

    // Create test reviews for the menu
    await db.insert(reviewsTable)
      .values([
        {
          menu_id: menu.id,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          rating: 5,
          comment: 'Excellent food!'
        },
        {
          menu_id: menu.id,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          rating: 4,
          comment: 'Very good'
        }
      ])
      .execute();

    const result = await getReviewsByMenu(menu.id);

    expect(result).toHaveLength(2);
    expect(result[0].menu_id).toEqual(menu.id);
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[0].rating).toEqual(5);
    expect(result[0].comment).toEqual('Excellent food!');
    expect(result[1].menu_id).toEqual(menu.id);
    expect(result[1].customer_name).toEqual('Jane Smith');
    expect(result[1].rating).toEqual(4);
    expect(result[1].comment).toEqual('Very good');
  });

  it('should return empty array for menu with no reviews', async () => {
    // Create a test menu
    const [menu] = await db.insert(menusTable)
      .values({
        name: 'Menu Without Reviews',
        description: 'A menu with no reviews'
      })
      .returning()
      .execute();

    const result = await getReviewsByMenu(menu.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent menu', async () => {
    const result = await getReviewsByMenu(999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return reviews for the specified menu', async () => {
    // Create two test menus
    const [menu1] = await db.insert(menusTable)
      .values({
        name: 'Menu 1',
        description: 'First menu'
      })
      .returning()
      .execute();

    const [menu2] = await db.insert(menusTable)
      .values({
        name: 'Menu 2',
        description: 'Second menu'
      })
      .returning()
      .execute();

    // Create reviews for both menus
    await db.insert(reviewsTable)
      .values([
        {
          menu_id: menu1.id,
          customer_name: 'Customer 1',
          customer_email: 'customer1@example.com',
          rating: 5,
          comment: 'Great menu 1!'
        },
        {
          menu_id: menu2.id,
          customer_name: 'Customer 2',
          customer_email: 'customer2@example.com',
          rating: 4,
          comment: 'Good menu 2!'
        },
        {
          menu_id: menu1.id,
          customer_name: 'Customer 3',
          customer_email: 'customer3@example.com',
          rating: 3,
          comment: 'Okay menu 1'
        }
      ])
      .execute();

    const result = await getReviewsByMenu(menu1.id);

    expect(result).toHaveLength(2);
    result.forEach(review => {
      expect(review.menu_id).toEqual(menu1.id);
    });
    expect(result[0].customer_name).toEqual('Customer 1');
    expect(result[1].customer_name).toEqual('Customer 3');
  });
});

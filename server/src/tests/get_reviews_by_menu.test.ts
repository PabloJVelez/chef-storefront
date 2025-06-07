
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menusTable, reviewsTable } from '../db/schema';
import { type CreateMenuInput, type CreateReviewInput } from '../schema';
import { getReviewsByMenu } from '../handlers/get_reviews_by_menu';

describe('getReviewsByMenu', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return reviews for a specific menu', async () => {
    // Create test menu
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;

    // Create test reviews
    await db.insert(reviewsTable)
      .values([
        {
          menu_id: menuId,
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          rating: 5,
          comment: 'Excellent food!'
        },
        {
          menu_id: menuId,
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          rating: 4,
          comment: 'Very good!'
        }
      ])
      .execute();

    const reviews = await getReviewsByMenu(menuId);

    expect(reviews).toHaveLength(2);
    expect(reviews[0].menu_id).toEqual(menuId);
    expect(reviews[0].customer_name).toEqual('John Doe');
    expect(reviews[0].rating).toEqual(5);
    expect(reviews[0].comment).toEqual('Excellent food!');
    expect(reviews[0].created_at).toBeInstanceOf(Date);

    expect(reviews[1].menu_id).toEqual(menuId);
    expect(reviews[1].customer_name).toEqual('Jane Smith');
    expect(reviews[1].rating).toEqual(4);
    expect(reviews[1].comment).toEqual('Very good!');
  });

  it('should return empty array when no reviews exist for menu', async () => {
    // Create test menu without reviews
    const menuResult = await db.insert(menusTable)
      .values({
        name: 'Test Menu',
        description: 'A test menu',
        thumbnail_image_url: null
      })
      .returning()
      .execute();

    const menuId = menuResult[0].id;
    const reviews = await getReviewsByMenu(menuId);

    expect(reviews).toHaveLength(0);
  });

  it('should only return reviews for specified menu', async () => {
    // Create two test menus
    const menuResults = await db.insert(menusTable)
      .values([
        {
          name: 'Menu 1',
          description: 'First menu',
          thumbnail_image_url: null
        },
        {
          name: 'Menu 2',
          description: 'Second menu',
          thumbnail_image_url: null
        }
      ])
      .returning()
      .execute();

    const menu1Id = menuResults[0].id;
    const menu2Id = menuResults[1].id;

    // Create reviews for both menus
    await db.insert(reviewsTable)
      .values([
        {
          menu_id: menu1Id,
          customer_name: 'Customer 1',
          customer_email: 'customer1@example.com',
          rating: 5,
          comment: 'Menu 1 review'
        },
        {
          menu_id: menu2Id,
          customer_name: 'Customer 2',
          customer_email: 'customer2@example.com',
          rating: 4,
          comment: 'Menu 2 review'
        }
      ])
      .execute();

    const menu1Reviews = await getReviewsByMenu(menu1Id);
    const menu2Reviews = await getReviewsByMenu(menu2Id);

    // Verify each menu only gets its own reviews
    expect(menu1Reviews).toHaveLength(1);
    expect(menu1Reviews[0].menu_id).toEqual(menu1Id);
    expect(menu1Reviews[0].comment).toEqual('Menu 1 review');

    expect(menu2Reviews).toHaveLength(1);
    expect(menu2Reviews[0].menu_id).toEqual(menu2Id);
    expect(menu2Reviews[0].comment).toEqual('Menu 2 review');
  });
});


import { db } from '../db';
import { serviceOptionsTable } from '../db/schema';
import { type ServiceOption } from '../schema';
import { eq } from 'drizzle-orm';

export const getServiceOptionsByMenu = async (menuId: number): Promise<ServiceOption[]> => {
  try {
    const results = await db.select()
      .from(serviceOptionsTable)
      .where(eq(serviceOptionsTable.menu_id, menuId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(option => ({
      ...option,
      price_per_person: parseFloat(option.price_per_person)
    }));
  } catch (error) {
    console.error('Failed to get service options by menu:', error);
    throw error;
  }
};

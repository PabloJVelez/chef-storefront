
import { db } from '../db';
import { serviceOptionsTable, menusTable } from '../db/schema';
import { type CreateServiceOptionInput, type ServiceOption } from '../schema';
import { eq } from 'drizzle-orm';

export const createServiceOption = async (input: CreateServiceOptionInput): Promise<ServiceOption> => {
  try {
    // Verify that the menu exists
    const menu = await db.select()
      .from(menusTable)
      .where(eq(menusTable.id, input.menu_id))
      .execute();

    if (menu.length === 0) {
      throw new Error('Menu not found');
    }

    // Insert service option record
    const result = await db.insert(serviceOptionsTable)
      .values({
        menu_id: input.menu_id,
        service_type: input.service_type,
        price_per_person: input.price_per_person.toString(), // Convert number to string for numeric column
        description: input.description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const serviceOption = result[0];
    return {
      ...serviceOption,
      price_per_person: parseFloat(serviceOption.price_per_person) // Convert string back to number
    };
  } catch (error) {
    console.error('Service option creation failed:', error);
    throw error;
  }
};

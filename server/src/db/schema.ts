
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  pgEnum,
  varchar,
  date,
  time
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const serviceTypeEnum = pgEnum('service_type', ['plated', 'buffet', 'cook-along']);
export const eventStatusEnum = pgEnum('event_status', ['pending', 'accepted', 'rejected', 'confirmed', 'completed']);

// Tables
export const menusTable = pgTable('menus', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  thumbnail_image_url: text('thumbnail_image_url'),
  average_rating: numeric('average_rating', { precision: 3, scale: 2 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const serviceOptionsTable = pgTable('service_options', {
  id: serial('id').primaryKey(),
  menu_id: integer('menu_id').notNull().references(() => menusTable.id, { onDelete: 'cascade' }),
  service_type: serviceTypeEnum('service_type').notNull(),
  price_per_person: numeric('price_per_person', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const eventRequestsTable = pgTable('event_requests', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  customer_phone: text('customer_phone'),
  menu_id: integer('menu_id').notNull().references(() => menusTable.id),
  service_option_id: integer('service_option_id').notNull().references(() => serviceOptionsTable.id),
  event_date: date('event_date').notNull(),
  event_time: time('event_time').notNull(),
  location: text('location').notNull(),
  guest_count: integer('guest_count').notNull(),
  special_requests: text('special_requests'),
  dietary_restrictions: text('dietary_restrictions'),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  status: eventStatusEnum('status').notNull().default('pending'),
  medusa_request_id: text('medusa_request_id'),
  checkout_url: text('checkout_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const reviewsTable = pgTable('reviews', {
  id: serial('id').primaryKey(),
  menu_id: integer('menu_id').notNull().references(() => menusTable.id, { onDelete: 'cascade' }),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const menusRelations = relations(menusTable, ({ many }) => ({
  service_options: many(serviceOptionsTable),
  event_requests: many(eventRequestsTable),
  reviews: many(reviewsTable)
}));

export const serviceOptionsRelations = relations(serviceOptionsTable, ({ one, many }) => ({
  menu: one(menusTable, {
    fields: [serviceOptionsTable.menu_id],
    references: [menusTable.id]
  }),
  event_requests: many(eventRequestsTable)
}));

export const eventRequestsRelations = relations(eventRequestsTable, ({ one }) => ({
  menu: one(menusTable, {
    fields: [eventRequestsTable.menu_id],
    references: [menusTable.id]
  }),
  service_option: one(serviceOptionsTable, {
    fields: [eventRequestsTable.service_option_id],
    references: [serviceOptionsTable.id]
  })
}));

export const reviewsRelations = relations(reviewsTable, ({ one }) => ({
  menu: one(menusTable, {
    fields: [reviewsTable.menu_id],
    references: [menusTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  menus: menusTable,
  serviceOptions: serviceOptionsTable,
  eventRequests: eventRequestsTable,
  reviews: reviewsTable
};

// TypeScript types
export type Menu = typeof menusTable.$inferSelect;
export type NewMenu = typeof menusTable.$inferInsert;

export type ServiceOption = typeof serviceOptionsTable.$inferSelect;
export type NewServiceOption = typeof serviceOptionsTable.$inferInsert;

export type EventRequest = typeof eventRequestsTable.$inferSelect;
export type NewEventRequest = typeof eventRequestsTable.$inferInsert;

export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;

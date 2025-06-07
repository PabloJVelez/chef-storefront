
import { z } from 'zod';

// Enums
export const serviceTypeEnum = z.enum(['plated', 'buffet', 'cook-along']);
export const eventStatusEnum = z.enum(['pending', 'accepted', 'rejected', 'confirmed', 'completed']);

// Menu schema
export const menuSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail_image_url: z.string().nullable(),
  average_rating: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Menu = z.infer<typeof menuSchema>;

// Service option schema
export const serviceOptionSchema = z.object({
  id: z.number(),
  menu_id: z.number(),
  service_type: serviceTypeEnum,
  price_per_person: z.number(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ServiceOption = z.infer<typeof serviceOptionSchema>;

// Event request schema
export const eventRequestSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string().nullable(),
  menu_id: z.number(),
  service_option_id: z.number(),
  event_date: z.coerce.date(),
  event_time: z.string(),
  location: z.string(),
  guest_count: z.number().int(),
  special_requests: z.string().nullable(),
  dietary_restrictions: z.string().nullable(),
  total_price: z.number(),
  status: eventStatusEnum,
  medusa_request_id: z.string().nullable(),
  checkout_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type EventRequest = z.infer<typeof eventRequestSchema>;

// Review schema
export const reviewSchema = z.object({
  id: z.number(),
  menu_id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

// Input schemas
export const createMenuInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  thumbnail_image_url: z.string().url().nullable()
});

export type CreateMenuInput = z.infer<typeof createMenuInputSchema>;

export const createServiceOptionInputSchema = z.object({
  menu_id: z.number(),
  service_type: serviceTypeEnum,
  price_per_person: z.number().positive(),
  description: z.string().nullable()
});

export type CreateServiceOptionInput = z.infer<typeof createServiceOptionInputSchema>;

export const createEventRequestInputSchema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().nullable(),
  menu_id: z.number(),
  service_option_id: z.number(),
  event_date: z.coerce.date(),
  event_time: z.string(),
  location: z.string().min(1),
  guest_count: z.number().int().positive(),
  special_requests: z.string().nullable(),
  dietary_restrictions: z.string().nullable()
});

export type CreateEventRequestInput = z.infer<typeof createEventRequestInputSchema>;

export const updateEventRequestStatusInputSchema = z.object({
  id: z.number(),
  status: eventStatusEnum,
  checkout_url: z.string().url().nullable()
});

export type UpdateEventRequestStatusInput = z.infer<typeof updateEventRequestStatusInputSchema>;

export const createReviewInputSchema = z.object({
  menu_id: z.number(),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable()
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Response schemas with relations
export const menuWithServiceOptionsSchema = menuSchema.extend({
  service_options: z.array(serviceOptionSchema),
  min_price: z.number().nullable()
});

export type MenuWithServiceOptions = z.infer<typeof menuWithServiceOptionsSchema>;

export const menuWithReviewsSchema = menuSchema.extend({
  reviews: z.array(reviewSchema),
  service_options: z.array(serviceOptionSchema),
  min_price: z.number().nullable()
});

export type MenuWithReviews = z.infer<typeof menuWithReviewsSchema>;

export const eventRequestWithDetailsSchema = eventRequestSchema.extend({
  menu: menuSchema,
  service_option: serviceOptionSchema
});

export type EventRequestWithDetails = z.infer<typeof eventRequestWithDetailsSchema>;

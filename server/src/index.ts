
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createMenuInputSchema,
  createServiceOptionInputSchema,
  createEventRequestInputSchema,
  updateEventRequestStatusInputSchema,
  createReviewInputSchema
} from './schema';

// Import handlers
import { getMenus } from './handlers/get_menus';
import { getMenuById } from './handlers/get_menu_by_id';
import { createMenu } from './handlers/create_menu';
import { createServiceOption } from './handlers/create_service_option';
import { getServiceOptionsByMenu } from './handlers/get_service_options_by_menu';
import { createEventRequest } from './handlers/create_event_request';
import { getEventRequests } from './handlers/get_event_requests';
import { getEventRequestById } from './handlers/get_event_request_by_id';
import { updateEventRequestStatus } from './handlers/update_event_request_status';
import { createReview } from './handlers/create_review';
import { getReviewsByMenu } from './handlers/get_reviews_by_menu';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Menu routes
  getMenus: publicProcedure
    .query(() => getMenus()),
  
  getMenuById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMenuById(input.id)),
  
  createMenu: publicProcedure
    .input(createMenuInputSchema)
    .mutation(({ input }) => createMenu(input)),

  // Service option routes
  createServiceOption: publicProcedure
    .input(createServiceOptionInputSchema)
    .mutation(({ input }) => createServiceOption(input)),
  
  getServiceOptionsByMenu: publicProcedure
    .input(z.object({ menuId: z.number() }))
    .query(({ input }) => getServiceOptionsByMenu(input.menuId)),

  // Event request routes
  createEventRequest: publicProcedure
    .input(createEventRequestInputSchema)
    .mutation(({ input }) => createEventRequest(input)),
  
  getEventRequests: publicProcedure
    .query(() => getEventRequests()),
  
  getEventRequestById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getEventRequestById(input.id)),
  
  updateEventRequestStatus: publicProcedure
    .input(updateEventRequestStatusInputSchema)
    .mutation(({ input }) => updateEventRequestStatus(input)),

  // Review routes
  createReview: publicProcedure
    .input(createReviewInputSchema)
    .mutation(({ input }) => createReview(input)),
  
  getReviewsByMenu: publicProcedure
    .input(z.object({ menuId: z.number() }))
    .query(({ input }) => getReviewsByMenu(input.menuId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { env } from './config/env.js';
import { errorHandler } from './utils/errors.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { areasRoutes } from './modules/areas/areas.routes.js';
import { reservationsRoutes } from './modules/reservations/reservations.routes.js';
import { inspectionsRoutes } from './modules/inspections/inspections.routes.js';
import { photosRoutes } from './modules/photos/photos.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
    },
  });

  // Serve uploaded files
  await app.register(fastifyStatic, {
    root: path.resolve(env.UPLOAD_DIR),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(areasRoutes, { prefix: '/api' });
  await app.register(reservationsRoutes, { prefix: '/api' });
  await app.register(inspectionsRoutes, { prefix: '/api' });
  await app.register(photosRoutes, { prefix: '/api' });

  return app;
}

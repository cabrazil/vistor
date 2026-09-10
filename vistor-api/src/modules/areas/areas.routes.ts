import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import * as areasService from './areas.service.js';

export async function areasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // GET /api/areas
  app.get('/areas', async (request) => {
    const { condominiumId } = request.user as { condominiumId: string };
    return areasService.listAreas(condominiumId);
  });

  // GET /api/areas/:id
  app.get('/areas/:id', async (request) => {
    const { id } = request.params as { id: string };
    return areasService.getAreaById(id);
  });

  // GET /api/environments/:id/items
  app.get('/environments/:id/items', async (request) => {
    const { id } = request.params as { id: string };
    return areasService.getEnvironmentItems(id);
  });
}

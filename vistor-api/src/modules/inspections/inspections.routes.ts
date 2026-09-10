import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import {
  createInspectionSchema,
  saveResultSchema,
  completeInspectionSchema,
} from './inspections.schemas.js';
import * as inspectionsService from './inspections.service.js';

export async function inspectionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/inspections
  app.post('/inspections', async (request, reply) => {
    const body = createInspectionSchema.parse(request.body);
    const { sub: inspectorId } = request.user as { sub: string };
    const inspection = await inspectionsService.createInspection(body, inspectorId);
    return reply.status(201).send(inspection);
  });

  // GET /api/inspections/:id
  app.get('/inspections/:id', async (request) => {
    const { id } = request.params as { id: string };
    return inspectionsService.getInspectionById(id);
  });

  // POST /api/inspections/:id/results
  app.post('/inspections/:id/results', async (request) => {
    const { id } = request.params as { id: string };
    const body = saveResultSchema.parse(request.body);
    return inspectionsService.saveResult(id, body);
  });

  // PATCH /api/inspections/:id/results/:resultId
  app.patch('/inspections/:id/results/:resultId', async (request) => {
    const { id } = request.params as { id: string };
    const body = saveResultSchema.parse(request.body);
    return inspectionsService.saveResult(id, body);
  });

  // POST /api/inspections/:id/complete
  app.post('/inspections/:id/complete', async (request) => {
    const { id } = request.params as { id: string };
    const body = completeInspectionSchema.parse(request.body);
    return inspectionsService.completeInspection(id, body);
  });

  // GET /api/inspections/:id/comparison
  app.get('/inspections/:id/comparison', async (request) => {
    const { id } = request.params as { id: string };
    return inspectionsService.getComparison(id);
  });
}

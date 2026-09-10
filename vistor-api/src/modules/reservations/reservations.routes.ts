import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import { createReservationSchema, updateReservationSchema } from './reservations.schemas.js';
import * as reservationsService from './reservations.service.js';

export async function reservationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // GET /api/reservations
  app.get('/reservations', async (request) => {
    const { condominiumId } = request.user as { condominiumId: string };
    const { status } = request.query as { status?: string };
    return reservationsService.listReservations(condominiumId, { status });
  });

  // GET /api/reservations/:id
  app.get('/reservations/:id', async (request) => {
    const { id } = request.params as { id: string };
    return reservationsService.getReservationById(id);
  });

  // POST /api/reservations
  app.post('/reservations', async (request, reply) => {
    const body = createReservationSchema.parse(request.body);
    const reservation = await reservationsService.createReservation(body);
    return reply.status(201).send(reservation);
  });

  // PATCH /api/reservations/:id
  app.patch('/reservations/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = updateReservationSchema.parse(request.body);
    return reservationsService.updateReservation(id, body);
  });

  // DELETE /api/reservations/:id
  app.delete('/reservations/:id', async (request) => {
    const { id } = request.params as { id: string };
    return reservationsService.deleteReservation(id);
  });
}

import { FastifyInstance } from 'fastify';
import { loginSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';
import { authGuard } from '../../middleware/auth.js';

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await authService.login(body);

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      condominiumId: user.condominiumId,
    });

    return reply.status(200).send({ token, user });
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [authGuard] }, async (request) => {
    const payload = request.user as { sub: string };
    const user = await authService.getUserById(payload.sub);
    return user;
  });
}

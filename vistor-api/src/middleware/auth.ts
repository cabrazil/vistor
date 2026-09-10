import { FastifyRequest, FastifyReply } from 'fastify';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido ou ausente.',
      statusCode: 401,
    });
  }
}

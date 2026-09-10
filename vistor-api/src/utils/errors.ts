import { FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(error: Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Prisma known errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2025') {
      return reply.status(404).send({
        error: 'NotFound',
        message: 'Registro não encontrado.',
        statusCode: 404,
      });
    }
    if (prismaError.code === 'P2002') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Registro duplicado.',
        statusCode: 409,
      });
    }
  }

  // Validation errors (Zod)
  if (error.name === 'ZodError') {
    return reply.status(422).send({
      error: 'ValidationError',
      message: 'Dados inválidos.',
      issues: (error as any).issues,
      statusCode: 422,
    });
  }

  // Unexpected errors
  request.log.error(error);
  return reply.status(500).send({
    error: 'InternalServerError',
    message: 'Erro interno do servidor.',
    statusCode: 500,
  });
}

import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { LoginInput } from './auth.schemas.js';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      condominium: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Email ou senha inválidos.', 401);
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AppError('Email ou senha inválidos.', 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    condominiumId: user.condominiumId,
    condominium: user.condominium,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      condominium: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    condominiumId: user.condominiumId,
    condominium: user.condominium,
  };
}

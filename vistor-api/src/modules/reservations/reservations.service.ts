import { prisma } from '../../lib/prisma.js';
import type { CreateReservationInput, UpdateReservationInput } from './reservations.schemas.js';

export async function listReservations(condominiumId: string, filters?: { status?: string }) {
  return prisma.reservation.findMany({
    where: {
      area: { condominiumId },
      ...(filters?.status ? { status: filters.status as any } : {}),
    },
    orderBy: { eventDate: 'desc' },
    include: {
      area: { select: { id: true, name: true } },
      inspections: {
        select: { id: true, type: true, status: true, startedAt: true, completedAt: true },
      },
    },
  });
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUniqueOrThrow({
    where: { id },
    include: {
      area: { select: { id: true, name: true } },
      inspections: {
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
          confirmedByName: true,
          inspector: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createReservation(input: CreateReservationInput) {
  return prisma.reservation.create({
    data: {
      areaId: input.areaId,
      unit: input.unit,
      responsibleName: input.responsibleName,
      responsiblePhone: input.responsiblePhone,
      eventDate: new Date(input.eventDate),
      startTime: input.startTime,
      endTime: input.endTime,
    },
  });
}

export async function updateReservation(id: string, input: UpdateReservationInput) {
  return prisma.reservation.update({
    where: { id },
    data: {
      ...input,
      ...(input.eventDate ? { eventDate: new Date(input.eventDate) } : {}),
    },
  });
}

export async function deleteReservation(id: string) {
  return prisma.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

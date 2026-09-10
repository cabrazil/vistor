import { prisma } from '../../lib/prisma.js';

export async function listAreas(condominiumId: string) {
  return prisma.area.findMany({
    where: { condominiumId, active: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { environments: true, reservations: true } },
    },
  });
}

export async function getAreaById(id: string) {
  return prisma.area.findUniqueOrThrow({
    where: { id },
    include: {
      environments: {
        where: { active: true },
        orderBy: { order: 'asc' },
        include: {
          items: {
            where: { active: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
}

export async function getEnvironmentItems(environmentId: string) {
  return prisma.inspectionItem.findMany({
    where: { environmentId, active: true },
    orderBy: { order: 'asc' },
  });
}

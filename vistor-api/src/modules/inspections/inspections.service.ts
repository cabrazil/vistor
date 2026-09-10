import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/errors.js';
import type { CreateInspectionInput, SaveResultInput, CompleteInspectionInput } from './inspections.schemas.js';

export async function createInspection(input: CreateInspectionInput, inspectorId: string) {
  // Check if reservation exists
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: input.reservationId },
  });

  // Check if inspection of this type already exists for this reservation
  const existing = await prisma.inspection.findUnique({
    where: {
      reservationId_type: {
        reservationId: input.reservationId,
        type: input.type,
      },
    },
  });

  if (existing) {
    throw new AppError(`Já existe uma vistoria de ${input.type === 'DELIVERY' ? 'entrega' : 'devolução'} para esta reserva.`, 409);
  }

  // If creating RETURN, check that DELIVERY exists and is completed
  if (input.type === 'RETURN') {
    const delivery = await prisma.inspection.findUnique({
      where: {
        reservationId_type: {
          reservationId: input.reservationId,
          type: 'DELIVERY',
        },
      },
    });

    if (!delivery || delivery.status !== 'COMPLETED') {
      throw new AppError('É necessário completar a vistoria de entrega antes da devolução.', 400);
    }
  }

  // Update reservation status
  const newStatus = input.type === 'DELIVERY' ? 'DELIVERY_INSPECTION' : 'AWAITING_RETURN';

  const inspection = await prisma.inspection.create({
    data: {
      reservationId: input.reservationId,
      type: input.type,
      inspectorId,
    },
  });

  await prisma.reservation.update({
    where: { id: input.reservationId },
    data: { status: newStatus as any },
  });

  return inspection;
}

export async function getInspectionById(id: string) {
  return prisma.inspection.findUniqueOrThrow({
    where: { id },
    include: {
      reservation: {
        select: {
          id: true,
          unit: true,
          responsibleName: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          area: { select: { id: true, name: true } },
        },
      },
      inspector: { select: { id: true, name: true } },
      results: {
        include: {
          inspectionItem: {
            include: {
              environment: { select: { id: true, name: true } },
            },
          },
          photos: true,
        },
        orderBy: {
          inspectionItem: { order: 'asc' },
        },
      },
    },
  });
}

export async function saveResult(inspectionId: string, input: SaveResultInput) {
  // Validate inspection is still in progress
  const inspection = await prisma.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
  });

  if (inspection.status === 'COMPLETED') {
    throw new AppError('Esta vistoria já foi finalizada.', 400);
  }

  // Validate that notes are provided for DAMAGED and MISSING
  if ((input.condition === 'DAMAGED' || input.condition === 'MISSING') && !input.notes?.trim()) {
    throw new AppError('Observação é obrigatória para itens danificados ou ausentes.', 422);
  }

  // Upsert the result
  return prisma.inspectionItemResult.upsert({
    where: {
      inspectionId_inspectionItemId: {
        inspectionId,
        inspectionItemId: input.inspectionItemId,
      },
    },
    create: {
      inspectionId,
      inspectionItemId: input.inspectionItemId,
      condition: input.condition,
      notes: input.notes,
      quantityFound: input.quantityFound,
    },
    update: {
      condition: input.condition,
      notes: input.notes,
      quantityFound: input.quantityFound,
    },
    include: {
      photos: true,
      inspectionItem: true,
    },
  });
}

export async function completeInspection(id: string, input: CompleteInspectionInput) {
  const inspection = await prisma.inspection.findUniqueOrThrow({
    where: { id },
    include: {
      reservation: {
        include: {
          area: {
            include: {
              environments: {
                where: { active: true },
                include: {
                  items: { where: { active: true } },
                },
              },
            },
          },
        },
      },
      results: true,
    },
  });

  if (inspection.status === 'COMPLETED') {
    throw new AppError('Esta vistoria já foi finalizada.', 400);
  }

  // Count total active items vs inspected items
  const totalItems = inspection.reservation.area.environments.reduce(
    (sum, env) => sum + env.items.length,
    0
  );
  const inspectedItems = inspection.results.length;

  if (inspectedItems < totalItems) {
    throw new AppError(
      `Ainda faltam ${totalItems - inspectedItems} itens para vistoriar.`,
      400
    );
  }

  // Complete inspection
  const completed = await prisma.inspection.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      confirmedByName: input.confirmedByName,
      confirmedAt: new Date(),
      notes: input.notes,
    },
  });

  // Update reservation status
  const newReservationStatus = inspection.type === 'DELIVERY' ? 'IN_USE' : 'COMPLETED';
  await prisma.reservation.update({
    where: { id: inspection.reservationId },
    data: { status: newReservationStatus as any },
  });

  return completed;
}

export async function getComparison(inspectionId: string) {
  // Get the inspection to find the reservation
  const inspection = await prisma.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
    select: { reservationId: true, type: true },
  });

  // Get both inspections for this reservation
  const inspections = await prisma.inspection.findMany({
    where: { reservationId: inspection.reservationId },
    include: {
      inspector: { select: { name: true } },
      results: {
        include: {
          inspectionItem: {
            include: {
              environment: { select: { id: true, name: true, order: true } },
            },
          },
          photos: true,
        },
      },
    },
  });

  const delivery = inspections.find((i) => i.type === 'DELIVERY');
  const returnInsp = inspections.find((i) => i.type === 'RETURN');

  if (!delivery) {
    throw new AppError('Vistoria de entrega não encontrada.', 404);
  }

  // Build comparison items
  const deliveryResultsMap = new Map(
    delivery.results.map((r) => [r.inspectionItemId, r])
  );
  const returnResultsMap = returnInsp
    ? new Map(returnInsp.results.map((r) => [r.inspectionItemId, r]))
    : new Map();

  // Get all item IDs from both inspections
  const allItemIds = new Set([
    ...deliveryResultsMap.keys(),
    ...returnResultsMap.keys(),
  ]);

  const items = Array.from(allItemIds).map((itemId) => {
    const deliveryResult = deliveryResultsMap.get(itemId);
    const returnResult = returnResultsMap.get(itemId);
    const itemInfo = deliveryResult?.inspectionItem || returnResult?.inspectionItem;

    const changed = returnResult
      ? deliveryResult?.condition !== returnResult.condition
      : false;

    return {
      itemId,
      itemName: itemInfo?.name || '',
      environment: itemInfo?.environment?.name || '',
      environmentOrder: itemInfo?.environment?.order || 0,
      delivery: deliveryResult
        ? {
            condition: deliveryResult.condition,
            notes: deliveryResult.notes,
            quantityFound: deliveryResult.quantityFound,
            photos: deliveryResult.photos,
          }
        : null,
      return: returnResult
        ? {
            condition: returnResult.condition,
            notes: returnResult.notes,
            quantityFound: returnResult.quantityFound,
            photos: returnResult.photos,
          }
        : null,
      changed,
    };
  });

  // Sort by environment order, then item name
  items.sort((a, b) => a.environmentOrder - b.environmentOrder || a.itemName.localeCompare(b.itemName));

  // Summary
  const totalItems = items.length;
  const unchanged = items.filter((i) => !i.changed).length;
  const changed = items.filter((i) => i.changed).length;
  const newIssues = items.filter(
    (i) =>
      i.changed &&
      i.return &&
      ['DAMAGED', 'MISSING', 'CAVEAT'].includes(i.return.condition) &&
      i.delivery?.condition === 'OK'
  ).length;

  return {
    reservationId: inspection.reservationId,
    delivery: delivery
      ? {
          id: delivery.id,
          startedAt: delivery.startedAt,
          completedAt: delivery.completedAt,
          inspector: delivery.inspector.name,
        }
      : null,
    return: returnInsp
      ? {
          id: returnInsp.id,
          startedAt: returnInsp.startedAt,
          completedAt: returnInsp.completedAt,
          inspector: returnInsp.inspector.name,
        }
      : null,
    summary: { totalItems, unchanged, changed, newIssues },
    items,
  };
}

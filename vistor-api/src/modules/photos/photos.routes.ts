import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { storage } from '../../lib/storage.js';
import { AppError } from '../../utils/errors.js';

export async function photosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  // POST /api/inspections/:id/results/:resultId/photos
  app.post('/inspections/:id/results/:resultId/photos', async (request, reply) => {
    const { id: inspectionId, resultId } = request.params as { id: string; resultId: string };

    // Verify inspection is in progress
    const inspection = await prisma.inspection.findUniqueOrThrow({
      where: { id: inspectionId },
    });

    if (inspection.status === 'COMPLETED') {
      throw new AppError('Não é possível adicionar fotos a uma vistoria finalizada.', 400);
    }

    // Verify result belongs to this inspection
    const result = await prisma.inspectionItemResult.findUniqueOrThrow({
      where: { id: resultId },
    });

    if (result.inspectionId !== inspectionId) {
      throw new AppError('Resultado não pertence a esta vistoria.', 400);
    }

    const file = await request.file();
    if (!file) {
      throw new AppError('Nenhum arquivo enviado.', 400);
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou HEIC.', 400);
    }

    const buffer = await file.toBuffer();
    const fileName = await storage.save(buffer, file.filename, file.mimetype);

    const photo = await prisma.inspectionPhoto.create({
      data: {
        resultId,
        url: storage.getUrl(fileName),
        originalName: file.filename,
        sizeBytes: buffer.length,
        mimeType: file.mimetype,
      },
    });

    return reply.status(201).send(photo);
  });

  // DELETE /api/photos/:id
  app.delete('/photos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const photo = await prisma.inspectionPhoto.findUniqueOrThrow({
      where: { id },
    });

    // Extract filename from URL
    const fileName = photo.url.split('/').pop();
    if (fileName) {
      await storage.delete(fileName);
    }

    await prisma.inspectionPhoto.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando seed do Vistor...');

  // ─── Zerar a base de dados (schema vistor) ────────────────
  console.log('🧹 Zerando base de dados existente (schema vistor)...');
  await prisma.inspectionPhoto.deleteMany();
  await prisma.inspectionItemResult.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inspectionItem.deleteMany();
  await prisma.environment.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();
  await prisma.condominium.deleteMany();
  console.log('✓ Base de dados zerada com sucesso!');

  // ─── Condomínio Arken ──────────────────────────────────
  const condominium = await prisma.condominium.create({
    data: {
      id: 'condo-demo-001',
      name: 'Arken',
      address: 'São Paulo, SP',
    },
  });
  console.log(`✓ Condomínio: ${condominium.name}`);

  // ─── Usuário Admin ─────────────────────────────────────
  const passwordHash = await bcrypt.hash('vistor123', 10);
  const admin = await prisma.user.create({
    data: {
      id: 'user-admin-001',
      email: 'admin@vistor.app',
      passwordHash,
      name: 'Administrador',
      role: 'ADMIN',
      condominiumId: condominium.id,
    },
  });
  console.log(`✓ Usuário admin: ${admin.email}`);

  // ─── Usuário Inspetor ──────────────────────────────────
  const inspector = await prisma.user.create({
    data: {
      id: 'user-inspector-001',
      email: 'zelador@vistor.app',
      passwordHash: await bcrypt.hash('vistor123', 10),
      name: 'João Zelador',
      role: 'INSPECTOR',
      condominiumId: condominium.id,
    },
  });
  console.log(`✓ Usuário inspetor: ${inspector.email}`);

  // ─── Área: Salão de Festas ─────────────────────────────
  const area = await prisma.area.create({
    data: {
      id: 'area-salao-001',
      name: 'Salão de Festas',
      description: 'Salão de festas principal do condomínio Arken, com capacidade para 80 pessoas.',
      condominiumId: condominium.id,
      order: 1,
    },
  });
  console.log(`✓ Área: ${area.name}`);

  // ─── Ambientes e Itens (Sem Área Externa e Sem Churrasqueira) ───
  const environmentsData = [
    {
      id: 'env-salao-principal',
      name: 'Salão Principal',
      order: 1,
      items: [
        { name: 'Piso', order: 1 },
        { name: 'Paredes', order: 2 },
        { name: 'Teto', order: 3 },
        { name: 'Iluminação', order: 4 },
        { name: 'Mesas', order: 5, hasQuantity: true, expectedQuantity: 8 },
        { name: 'Cadeiras', order: 6, hasQuantity: true, expectedQuantity: 40 },
        { name: 'Sofás', order: 7, hasQuantity: true, expectedQuantity: 2 },
        { name: 'TV', order: 8, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Ar-condicionado', order: 9, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Cortinas', order: 10 },
        { name: 'Tomadas', order: 11 },
      ],
    },
    {
      id: 'env-cozinha',
      name: 'Cozinha',
      order: 2,
      items: [
        { name: 'Geladeira', order: 1, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Freezer', order: 2, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Micro-ondas', order: 3, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Forno', order: 4, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Cooktop', order: 5, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Pia', order: 6 },
        { name: 'Torneira', order: 7 },
        { name: 'Bancadas', order: 8 },
        { name: 'Armários', order: 9 },
        { name: 'Piso', order: 10 },
        { name: 'Iluminação', order: 11 },
      ],
    },
    {
      id: 'env-banheiros',
      name: 'Banheiros',
      order: 3,
      items: [
        { name: 'Vasos sanitários', order: 1, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Pias', order: 2, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Torneiras', order: 3, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Espelhos', order: 4, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Iluminação', order: 5 },
        { name: 'Portas', order: 6, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Lixeiras', order: 7, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Piso', order: 8 },
      ],
    },
    {
      id: 'env-equipamentos',
      name: 'Equipamentos',
      order: 4,
      items: [
        { name: 'Caixa de som', order: 1, hasQuantity: true, expectedQuantity: 2 },
        { name: 'Microfone', order: 2, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Projetor', order: 3, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Tela de projeção', order: 4, hasQuantity: true, expectedQuantity: 1 },
        { name: 'Extensão elétrica', order: 5, hasQuantity: true, expectedQuantity: 2 },
      ],
    },
  ];

  for (const envData of environmentsData) {
    const environment = await prisma.environment.create({
      data: {
        id: envData.id,
        name: envData.name,
        areaId: area.id,
        order: envData.order,
      },
    });

    for (const item of envData.items) {
      await prisma.inspectionItem.create({
        data: {
          id: `item-${envData.id}-${item.order}`,
          name: item.name,
          environmentId: environment.id,
          hasQuantity: item.hasQuantity || false,
          expectedQuantity: item.expectedQuantity || null,
          order: item.order,
        },
      });
    }

    console.log(`  ✓ Ambiente: ${envData.name} (${envData.items.length} itens)`);
  }

  // ─── Reservas fictícias limpas (prontas para nova vistoria) ────────
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const reservations = [
    {
      id: 'res-001',
      unit: 'Apto 84',
      responsibleName: 'Maria Silva',
      responsiblePhone: '(11) 98765-4321',
      eventDate: tomorrow,
      startTime: '18:00',
      endTime: '23:00',
      status: 'SCHEDULED' as const,
    },
    {
      id: 'res-002',
      unit: 'Apto 32',
      responsibleName: 'Carlos Oliveira',
      responsiblePhone: '(11) 91234-5678',
      eventDate: nextWeek,
      startTime: '14:00',
      endTime: '20:00',
      status: 'SCHEDULED' as const,
    },
    {
      id: 'res-003',
      unit: 'Apto 71',
      responsibleName: 'Ana Santos',
      responsiblePhone: '(11) 99876-5432',
      eventDate: lastWeek,
      startTime: '19:00',
      endTime: '00:00',
      status: 'COMPLETED' as const,
    },
  ];

  for (const res of reservations) {
    await prisma.reservation.create({
      data: {
        id: res.id,
        areaId: area.id,
        unit: res.unit,
        responsibleName: res.responsibleName,
        responsiblePhone: res.responsiblePhone,
        eventDate: res.eventDate,
        startTime: res.startTime,
        endTime: res.endTime,
        status: res.status,
      },
    });
    console.log(`  ✓ Reserva: ${res.unit} - ${res.responsibleName}`);
  }

  console.log('\n✅ Seed Arken concluído com sucesso!');
  console.log('\n📋 Resumo:');
  console.log(`   Condomínio: ${condominium.name}`);
  console.log(`   Área: ${area.name}`);
  console.log(`   Ambientes: ${environmentsData.length} (Salão Principal, Cozinha, Banheiros, Equipamentos)`);
  console.log(`   Itens: ${environmentsData.reduce((sum, e) => sum + e.items.length, 0)}`);
  console.log(`   Reservas: ${reservations.length}`);
  console.log(`   Usuários: admin@vistor.app / zelador@vistor.app (senha: vistor123)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

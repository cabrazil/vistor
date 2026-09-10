import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Seeding Vistor database...');
    // ─── Condomínio ────────────────────────────────────────
    const condominium = await prisma.condominium.upsert({
        where: { id: 'condo-demo-001' },
        update: {},
        create: {
            id: 'condo-demo-001',
            name: 'Condomínio Residencial Parque das Flores',
            address: 'Rua das Acácias, 500 - São Paulo, SP',
        },
    });
    console.log(`✓ Condomínio: ${condominium.name}`);
    // ─── Usuário Admin ─────────────────────────────────────
    const passwordHash = await bcrypt.hash('vistor123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@vistor.app' },
        update: {},
        create: {
            email: 'admin@vistor.app',
            passwordHash,
            name: 'Administrador',
            role: 'ADMIN',
            condominiumId: condominium.id,
        },
    });
    console.log(`✓ Usuário admin: ${admin.email}`);
    // ─── Usuário Inspetor ──────────────────────────────────
    const inspector = await prisma.user.upsert({
        where: { email: 'zelador@vistor.app' },
        update: {},
        create: {
            email: 'zelador@vistor.app',
            passwordHash: await bcrypt.hash('vistor123', 10),
            name: 'João Zelador',
            role: 'INSPECTOR',
            condominiumId: condominium.id,
        },
    });
    console.log(`✓ Usuário inspetor: ${inspector.email}`);
    // ─── Área: Salão de Festas ─────────────────────────────
    const area = await prisma.area.upsert({
        where: { id: 'area-salao-001' },
        update: {},
        create: {
            id: 'area-salao-001',
            name: 'Salão de Festas',
            description: 'Salão de festas principal do condomínio, com capacidade para 80 pessoas.',
            condominiumId: condominium.id,
            order: 1,
        },
    });
    console.log(`✓ Área: ${area.name}`);
    // ─── Ambientes e Itens ─────────────────────────────────
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
            id: 'env-churrasqueira',
            name: 'Churrasqueira',
            order: 4,
            items: [
                { name: 'Churrasqueira', order: 1 },
                { name: 'Grelha', order: 2 },
                { name: 'Bancada', order: 3 },
                { name: 'Pia', order: 4 },
                { name: 'Torneira', order: 5 },
                { name: 'Iluminação', order: 6 },
            ],
        },
        {
            id: 'env-area-externa',
            name: 'Área Externa',
            order: 5,
            items: [
                { name: 'Piso/calçada', order: 1 },
                { name: 'Iluminação externa', order: 2 },
                { name: 'Jardim/paisagismo', order: 3 },
                { name: 'Portão de acesso', order: 4 },
                { name: 'Lixeiras externas', order: 5, hasQuantity: true, expectedQuantity: 2 },
            ],
        },
        {
            id: 'env-equipamentos',
            name: 'Equipamentos',
            order: 6,
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
        const environment = await prisma.environment.upsert({
            where: { id: envData.id },
            update: {},
            create: {
                id: envData.id,
                name: envData.name,
                areaId: area.id,
                order: envData.order,
            },
        });
        for (const item of envData.items) {
            await prisma.inspectionItem.upsert({
                where: { id: `item-${envData.id}-${item.order}` },
                update: {},
                create: {
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
    // ─── Reservas fictícias ────────────────────────────────
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
            status: 'SCHEDULED',
        },
        {
            id: 'res-002',
            unit: 'Apto 32',
            responsibleName: 'Carlos Oliveira',
            responsiblePhone: '(11) 91234-5678',
            eventDate: nextWeek,
            startTime: '14:00',
            endTime: '20:00',
            status: 'SCHEDULED',
        },
        {
            id: 'res-003',
            unit: 'Apto 71',
            responsibleName: 'Ana Santos',
            responsiblePhone: '(11) 99876-5432',
            eventDate: lastWeek,
            startTime: '19:00',
            endTime: '00:00',
            status: 'COMPLETED',
        },
    ];
    for (const res of reservations) {
        await prisma.reservation.upsert({
            where: { id: res.id },
            update: {},
            create: {
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
    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log(`   Condomínio: ${condominium.name}`);
    console.log(`   Área: ${area.name}`);
    console.log(`   Ambientes: ${environmentsData.length}`);
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
//# sourceMappingURL=seed.js.map
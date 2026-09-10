# Vistor

Sistema PWA mobile-first para vistoria de espaços compartilhados de condomínio.

## Stack

- **Frontend**: React + Vite + Tailwind CSS v4 (PWA)
- **Backend**: Fastify + TypeScript + Prisma
- **Banco**: PostgreSQL (Supabase)

## Desenvolvimento

### Backend

```bash
cd vistor-api
cp .env.example .env  # Configurar variáveis
npm run db:migrate     # Criar tabelas
npm run db:seed        # Popular dados de demo
npm run dev            # Iniciar servidor (porta 3334)
```

### Frontend

```bash
cd vistor-app
cp .env.example .env
npm run dev            # Iniciar dev server (porta 5173)
```

### Credenciais de demo

- Admin: `admin@vistor.app` / `vistor123`
- Zelador: `zelador@vistor.app` / `vistor123`

## Estrutura

```
vistor/
├── vistor-api/    # Backend Fastify + Prisma
├── vistor-app/    # Frontend React PWA
└── Vistor-Plano.md
```

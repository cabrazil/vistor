-- ══════════════════════════════════════════════════════════════
-- VISTOR SCHEMA — ISOLAMENTO TOTAL NO SUPABASE
-- Este script opera EXCLUSIVAMENTE dentro do schema "vistor",
-- garantindo que nenhuma tabela ou dado de outros projetos seja afetado.
-- ══════════════════════════════════════════════════════════════

-- 1. Criação e seleção do schema isolado
CREATE SCHEMA IF NOT EXISTS "vistor";
SET search_path TO "vistor";

-- 2. Enums (todos dentro de "vistor")
DO $$ BEGIN
  CREATE TYPE "vistor"."UserRole" AS ENUM ('ADMIN', 'INSPECTOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vistor"."ReservationStatus" AS ENUM ('SCHEDULED', 'DELIVERY_INSPECTION', 'IN_USE', 'AWAITING_RETURN', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vistor"."InspectionType" AS ENUM ('DELIVERY', 'RETURN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vistor"."InspectionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "vistor"."ItemCondition" AS ENUM ('OK', 'CAVEAT', 'DAMAGED', 'MISSING', 'NA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabelas (todas qualificadas explicitamente com "vistor")

CREATE TABLE IF NOT EXISTS "vistor"."condominiums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "condominiums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "vistor"."UserRole" NOT NULL DEFAULT 'INSPECTOR',
    "condominium_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condominium_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."environments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."inspection_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "has_quantity" BOOLEAN NOT NULL DEFAULT false,
    "expected_quantity" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."reservations" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "responsible_name" TEXT NOT NULL,
    "responsible_phone" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" "vistor"."ReservationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."inspections" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "type" "vistor"."InspectionType" NOT NULL,
    "status" "vistor"."InspectionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "inspector_id" TEXT NOT NULL,
    "confirmed_by_name" TEXT,
    "signature_url" TEXT,
    "notes" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."inspection_item_results" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "inspection_item_id" TEXT NOT NULL,
    "condition" "vistor"."ItemCondition" NOT NULL,
    "notes" TEXT,
    "quantity_found" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inspection_item_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vistor"."inspection_photos" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "original_name" TEXT,
    "size_bytes" INTEGER,
    "mime_type" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id")
);

-- 4. Índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "vistor"."users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "inspections_reservation_id_type_key" ON "vistor"."inspections"("reservation_id", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "inspection_item_results_inspection_id_inspection_item_id_key" ON "vistor"."inspection_item_results"("inspection_id", "inspection_item_id");

-- 5. Chaves estrangeiras (somente dentro de "vistor")
DO $$ BEGIN
  ALTER TABLE "vistor"."users" ADD CONSTRAINT "users_condominium_id_fkey" 
    FOREIGN KEY ("condominium_id") REFERENCES "vistor"."condominiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."areas" ADD CONSTRAINT "areas_condominium_id_fkey" 
    FOREIGN KEY ("condominium_id") REFERENCES "vistor"."condominiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."environments" ADD CONSTRAINT "environments_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "vistor"."areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspection_items" ADD CONSTRAINT "inspection_items_environment_id_fkey" 
    FOREIGN KEY ("environment_id") REFERENCES "vistor"."environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."reservations" ADD CONSTRAINT "reservations_area_id_fkey" 
    FOREIGN KEY ("area_id") REFERENCES "vistor"."areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspections" ADD CONSTRAINT "inspections_reservation_id_fkey" 
    FOREIGN KEY ("reservation_id") REFERENCES "vistor"."reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspections" ADD CONSTRAINT "inspections_inspector_id_fkey" 
    FOREIGN KEY ("inspector_id") REFERENCES "vistor"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspection_item_results" ADD CONSTRAINT "inspection_item_results_inspection_id_fkey" 
    FOREIGN KEY ("inspection_id") REFERENCES "vistor"."inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspection_item_results" ADD CONSTRAINT "inspection_item_results_inspection_item_id_fkey" 
    FOREIGN KEY ("inspection_item_id") REFERENCES "vistor"."inspection_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "vistor"."inspection_photos" ADD CONSTRAINT "inspection_photos_result_id_fkey" 
    FOREIGN KEY ("result_id") REFERENCES "vistor"."inspection_item_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

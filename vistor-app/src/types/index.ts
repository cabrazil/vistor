// ─── Enums ───────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'INSPECTOR';
export type ReservationStatus = 'SCHEDULED' | 'DELIVERY_INSPECTION' | 'IN_USE' | 'AWAITING_RETURN' | 'COMPLETED' | 'CANCELLED';
export type InspectionType = 'DELIVERY' | 'RETURN';
export type InspectionStatus = 'IN_PROGRESS' | 'COMPLETED';
export type ItemCondition = 'OK' | 'CAVEAT' | 'DAMAGED' | 'MISSING' | 'NA';

// ─── Models ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  condominiumId: string;
  condominium: {
    id: string;
    name: string;
  };
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  order: number;
  _count?: {
    environments: number;
    reservations: number;
  };
}

export interface Environment {
  id: string;
  name: string;
  order: number;
  items: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  name: string;
  hasQuantity: boolean;
  expectedQuantity?: number | null;
  order: number;
}

export interface Reservation {
  id: string;
  unit: string;
  responsibleName: string;
  responsiblePhone?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  area: {
    id: string;
    name: string;
  };
  inspections: InspectionSummary[];
}

export interface InspectionSummary {
  id: string;
  type: InspectionType;
  status: InspectionStatus;
  startedAt: string;
  completedAt?: string;
}

export interface Inspection {
  id: string;
  type: InspectionType;
  status: InspectionStatus;
  startedAt: string;
  completedAt?: string;
  confirmedByName?: string;
  notes?: string;
  reservation: {
    id: string;
    unit: string;
    responsibleName: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    area: { id: string; name: string };
  };
  inspector: { id: string; name: string };
  results: InspectionItemResult[];
}

export interface InspectionItemResult {
  id: string;
  condition: ItemCondition;
  notes?: string;
  quantityFound?: number | null;
  inspectionItem: InspectionItem & {
    environment: { id: string; name: string };
  };
  photos: InspectionPhoto[];
}

export interface InspectionPhoto {
  id: string;
  url: string;
  originalName?: string;
  capturedAt: string;
}

// ─── Comparison ──────────────────────────────────────────

export interface ComparisonData {
  reservationId: string;
  delivery: {
    id: string;
    startedAt: string;
    completedAt?: string;
    inspector: string;
  } | null;
  return: {
    id: string;
    startedAt: string;
    completedAt?: string;
    inspector: string;
  } | null;
  summary: {
    totalItems: number;
    unchanged: number;
    changed: number;
    newIssues: number;
  };
  items: ComparisonItem[];
}

export interface ComparisonItem {
  itemId: string;
  itemName: string;
  environment: string;
  delivery: {
    condition: ItemCondition;
    notes?: string;
    quantityFound?: number;
    photos: InspectionPhoto[];
  } | null;
  return: {
    condition: ItemCondition;
    notes?: string;
    quantityFound?: number;
    photos: InspectionPhoto[];
  } | null;
  changed: boolean;
}

// ─── Auth ────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Labels & Display ────────────────────────────────────

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  OK: 'OK',
  CAVEAT: 'Ressalva',
  DAMAGED: 'Danificado',
  MISSING: 'Ausente',
  NA: 'N/A',
};

export const CONDITION_ICONS: Record<ItemCondition, string> = {
  OK: '✓',
  CAVEAT: '!',
  DAMAGED: '✕',
  MISSING: '?',
  NA: '—',
};

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  SCHEDULED: 'Agendada',
  DELIVERY_INSPECTION: 'Em Vistoria',
  IN_USE: 'Em Uso',
  AWAITING_RETURN: 'Aguardando Devolução',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

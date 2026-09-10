import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Reservation, InspectionSummary } from '../types';
import { STATUS_LABELS } from '../types';

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.get<Reservation>(`/reservations/${id}`)
      .then(setReservation)
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar a reserva.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleStartInspection = async (type: 'DELIVERY' | 'RETURN') => {
    if (!reservation) return;
    setIsStarting(true);
    try {
      const inspection = await api.post<{ id: string }>('/inspections', {
        reservationId: reservation.id,
        type,
      });
      navigate(`/inspections/${inspection.id}`);
    } catch (err: any) {
      console.error(err);
      const existing = reservation.inspections.find((i: InspectionSummary) => i.type === type);
      if (existing) {
        navigate(`/inspections/${existing.id}`);
      } else {
        alert(err.message || 'Erro ao iniciar vistoria.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Carregando reserva...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-dvh text-slate-100 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-rose-400 mb-4 font-semibold">{error || 'Reserva não encontrada'}</p>
        <Link to="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all">
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const deliveryInspection = reservation.inspections?.find((i) => i.type === 'DELIVERY');
  const returnInspection = reservation.inspections?.find((i) => i.type === 'RETURN');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center pb-16 w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Início
          </button>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30 shadow-md">
            {STATUS_LABELS[reservation.status]}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Reservation Hero Card */}
        <section className="relative overflow-hidden glass-card rounded-3xl p-7 sm:p-8 border-white/10 shadow-2xl flex flex-col gap-5">
          <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {reservation.area.name}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {reservation.unit}
              </h1>
            </div>
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs text-slate-300">
            <div className="flex items-center gap-2.5 bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm shrink-0">
                👤
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Responsável</span>
                <strong className="text-white truncate block text-sm">{reservation.responsibleName}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm shrink-0">
                ⏰
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Horário do Evento</span>
                <strong className="text-white block text-sm">{reservation.startTime} às {reservation.endTime}</strong>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 capitalize px-1">
            📅 {formatDate(reservation.eventDate)}
          </p>
        </section>

        {/* Visual Inspection Stepper */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Fluxo Operacional de Vistorias
          </h2>

          {/* Entrega Card */}
          <div className="glass-card rounded-3xl p-6 border-white/10 flex flex-col gap-4 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-md shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">1. Vistoria de Entrega</h3>
                  <p className="text-xs text-slate-400">Inspeção prévia antes do início do evento</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border shrink-0 ${
                deliveryInspection?.status === 'COMPLETED'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : deliveryInspection?.status === 'IN_PROGRESS'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {deliveryInspection?.status === 'COMPLETED'
                  ? 'Concluída ✓'
                  : deliveryInspection?.status === 'IN_PROGRESS'
                  ? 'Em Andamento'
                  : 'Pendente'}
              </span>
            </div>

            {deliveryInspection ? (
              <button
                onClick={() => navigate(`/inspections/${deliveryInspection.id}`)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                {deliveryInspection.status === 'COMPLETED' ? 'Visualizar Vistoria de Entrega' : 'Continuar Vistoria de Entrega'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handleStartInspection('DELIVERY')}
                disabled={isStarting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50"
              >
                {isStarting ? 'Iniciando...' : 'Iniciar Vistoria de Entrega'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Devolução Card */}
          <div className={`glass-card rounded-3xl p-6 border-white/10 flex flex-col gap-4 transition-all ${
            deliveryInspection?.status === 'COMPLETED' ? 'hover:border-purple-500/30' : 'opacity-60'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shadow-md shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">2. Vistoria de Devolução</h3>
                  <p className="text-xs text-slate-400">Inspeção pós-evento com referência da entrega</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border shrink-0 ${
                returnInspection?.status === 'COMPLETED'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : returnInspection?.status === 'IN_PROGRESS'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {returnInspection?.status === 'COMPLETED'
                  ? 'Concluída ✓'
                  : returnInspection?.status === 'IN_PROGRESS'
                  ? 'Em Andamento'
                  : 'Pendente'}
              </span>
            </div>

            {returnInspection ? (
              <button
                onClick={() => navigate(`/inspections/${returnInspection.id}`)}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 active:scale-[0.98]"
              >
                {returnInspection.status === 'COMPLETED' ? 'Visualizar Vistoria de Devolução' : 'Continuar Vistoria de Devolução'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : deliveryInspection?.status === 'COMPLETED' ? (
              <button
                onClick={() => handleStartInspection('RETURN')}
                disabled={isStarting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/30 active:scale-[0.98] disabled:opacity-50"
              >
                {isStarting ? 'Iniciando...' : 'Iniciar Vistoria de Devolução'}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <p className="text-xs text-slate-500 text-center py-3 bg-slate-950/60 rounded-2xl border border-white/5">
                🔒 A entrega deve ser concluída antes da devolução.
              </p>
            )}
          </div>
        </section>

        {/* COMPARISON CALL TO ACTION */}
        {deliveryInspection?.status === 'COMPLETED' && returnInspection?.status === 'COMPLETED' && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl text-center flex flex-col gap-3">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 block">
              ✨ Ciclo Completo Concluído
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">Comparativo Entrega × Devolução</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Veja exatamente o que mudou no salão, itens com avarias e divergências registradas.
            </p>
            <button
              onClick={() => navigate(`/inspections/${returnInspection.id}/comparison`)}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.98]"
            >
              <span>Ver Diagnóstico: O Que Mudou?</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

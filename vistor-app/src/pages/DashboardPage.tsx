import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Reservation } from '../types';
import { STATUS_LABELS } from '../types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get<Reservation[]>('/reservations')
      .then(setReservations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const upcoming = useMemo(() => {
    return reservations
      .filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [reservations]);

  const history = useMemo(() => {
    return reservations
      .filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED')
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }, [reservations]);

  const nextReservation = upcoming[0];

  const formatDateBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() === today.getTime()) return { label: 'Hoje', isUrgent: true };
    if (target.getTime() === tomorrow.getTime()) return { label: 'Amanhã', isUrgent: false };
    return {
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      isUrgent: false,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERY_INSPECTION':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'IN_USE':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'AWAITING_RETURN':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center pb-16 w-full">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25 shrink-0">
              V
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-none flex items-center gap-2">
                Vistor
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  {user?.role || 'PRO'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-[220px] sm:max-w-xs">
                {user?.condominium?.name || 'Condomínio'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-white block">{user?.name}</span>
              <span className="text-[10px] text-slate-400">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sair da conta"
              className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-rose-500/15 hover:text-rose-300 text-slate-400 border border-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-xs">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Space Highlight Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-white/10 p-7 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Espaço em Operação
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Salão de Festas Principal</h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Capacidade: 80 pessoas • 6 ambientes • 46 itens catalogados
              </p>
            </div>
            <div className="w-14 h-14 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-xl shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </section>

        {/* Quick KPI Overview */}
        <section className="grid grid-cols-3 gap-3.5 sm:gap-5">
          <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border-white/10 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white">{upcoming.length}</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Agendadas</span>
          </div>
          <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border-amber-500/25 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {reservations.filter((r) => r.status === 'DELIVERY_INSPECTION' || r.status === 'AWAITING_RETURN').length}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-amber-300/80 uppercase tracking-wider">Em Vistoria</span>
          </div>
          <div className="glass-card rounded-2xl p-4 sm:p-5 text-center border-emerald-500/25 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {reservations.filter((r) => r.status === 'COMPLETED').length}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-300/80 uppercase tracking-wider">Concluídas</span>
          </div>
        </section>

        {/* HERO: Next Reservation */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Próxima Vistoria Agendada
            </span>
            {nextReservation && (
              <span className="text-xs text-indigo-400 font-semibold">
                Prioridade Máxima
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-56 rounded-3xl glass-card animate-pulse" />
          ) : nextReservation ? (
            <div className="relative group overflow-hidden rounded-3xl glass-card p-7 sm:p-8 border-indigo-500/30 shadow-2xl shadow-indigo-950/25 flex flex-col gap-6">
              <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Unidade Reservada
                    </span>
                    {(() => {
                      const badge = formatDateBadge(nextReservation.eventDate);
                      return (
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          badge.isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {nextReservation.unit}
                  </h3>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${getStatusBadge(nextReservation.status)}`}>
                  {STATUS_LABELS[nextReservation.status]}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300 border-t border-white/5">
                <div className="flex items-center gap-2.5 bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm shrink-0">
                    👤
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Morador</span>
                    <strong className="text-white truncate block">{nextReservation.responsibleName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-slate-950/50 p-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-sm shrink-0">
                    ⏰
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Horário</span>
                    <strong className="text-white block">{nextReservation.startTime} às {nextReservation.endTime}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/reservations/${nextReservation.id}`)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm sm:text-base transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <span>Acessar Vistoria do {nextReservation.unit}</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-2 border-white/10">
              <span className="text-4xl">🎉</span>
              <h3 className="text-base font-bold text-white">Nenhuma vistoria pendente</h3>
              <p className="text-xs text-slate-400">Todas as reservas agendadas estão em dia.</p>
            </div>
          )}
        </section>

        {/* Tab Switcher & List */}
        <section className="flex flex-col gap-4">
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'UPCOMING'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Próximas Reservas ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Histórico / Concluídas ({history.length})
            </button>
          </div>

          {/* List of Reservations */}
          <div className="flex flex-col gap-3">
            {(activeTab === 'UPCOMING' ? upcoming : history).map((res) => (
              <div
                key={res.id}
                onClick={() => navigate(`/reservations/${res.id}`)}
                className="glass-card-interactive rounded-2xl p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2.5">
                    <strong className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                      {res.unit}
                    </strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(res.status)}`}>
                      {STATUS_LABELS[res.status]}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 truncate">
                    {res.responsibleName} • {new Date(res.eventDate).toLocaleDateString('pt-BR')} ({res.startTime} - {res.endTime})
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-800/90 group-hover:bg-indigo-600/25 group-hover:text-indigo-300 text-slate-400 flex items-center justify-center transition-all shrink-0 border border-white/5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

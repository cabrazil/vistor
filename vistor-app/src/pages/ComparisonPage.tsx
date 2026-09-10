import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ComparisonData, ItemCondition } from '../types';
import { CONDITION_LABELS } from '../types';

export default function ComparisonPage() {
  const { id: inspectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ComparisonData | null>(null);
  const [filterChangedOnly, setFilterChangedOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspectionId) return;
    setIsLoading(true);

    api.get<ComparisonData>(`/inspections/${inspectionId}/comparison`)
      .then((res) => {
        setData(res);
        if (res.summary.changed === 0) {
          setFilterChangedOnly(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar o comparativo.');
      })
      .finally(() => setIsLoading(false));
  }, [inspectionId]);

  const itemsToDisplay = useMemo(() => {
    if (!data) return [];
    if (filterChangedOnly) {
      return data.items.filter((i) => i.changed);
    }
    return data.items;
  }, [data, filterChangedOnly]);

  const getConditionBadgeClass = (cond?: ItemCondition) => {
    switch (cond) {
      case 'OK':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'CAVEAT':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'DAMAGED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'MISSING':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Cruzando dados de entrega e devolução...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-dvh text-slate-100 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-rose-400 mb-4 font-semibold">{error || 'Comparativo não disponível.'}</p>
        <Link to="/" className="px-5 py-2.5 bg-slate-800 rounded-2xl text-xs font-bold">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center pb-16 w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/reservations/${data.reservationId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar à Reserva
          </button>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Entrega × Devolução
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Core Product Question Highlight */}
        <div className="relative overflow-hidden glass-card rounded-3xl p-7 sm:p-8 border-white/10 shadow-2xl flex flex-col gap-2">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Diagnóstico do Espaço
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            O que mudou no salão?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Comparação fotográfica e técnica entre a entrega inicial e a devolução final.
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center border-white/5 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white block">{data.summary.totalItems}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Itens</span>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border-emerald-500/20 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">{data.summary.unchanged}</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300/80 uppercase tracking-wider">Intactos</span>
          </div>
          <div className={`glass-card rounded-2xl p-4 text-center border-amber-500/20 flex flex-col items-center justify-center gap-1 ${
            data.summary.changed > 0 ? 'glow-amber' : ''
          }`}>
            <span className={`text-2xl sm:text-3xl font-black block ${data.summary.changed > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {data.summary.changed}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-300/80 uppercase tracking-wider">Alterados</span>
          </div>
          <div className={`glass-card rounded-2xl p-4 text-center border-rose-500/20 flex flex-col items-center justify-center gap-1 ${
            data.summary.newIssues > 0 ? 'glow-rose bg-rose-950/20' : ''
          }`}>
            <span className={`text-2xl sm:text-3xl font-black block ${data.summary.newIssues > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {data.summary.newIssues}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-rose-300/80 uppercase tracking-wider">Danos</span>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setFilterChangedOnly(true)}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterChangedOnly
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apenas Divergências ({data.summary.changed})
          </button>
          <button
            type="button"
            onClick={() => setFilterChangedOnly(false)}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              !filterChangedOnly
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos os Itens ({data.items.length})
          </button>
        </div>

        {/* Comparison List */}
        <div className="flex flex-col gap-4">
          {itemsToDisplay.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 border-emerald-500/20">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center font-black text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-black text-white">Nenhuma Avaria Identificada</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto">
                Todos os itens avaliados foram devolvidos no mesmo estado em que foram entregues.
              </p>
            </div>
          ) : (
            itemsToDisplay.map((item) => (
              <div
                key={item.itemId}
                className={`glass-card rounded-3xl p-6 sm:p-7 flex flex-col gap-4 transition-all ${
                  item.changed
                    ? 'border-rose-500/40 glow-rose'
                    : 'border-white/5'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {item.environment}
                    </span>
                    <strong className="text-lg font-black text-white">
                      {item.itemName}
                    </strong>
                  </div>
                  {item.changed ? (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      Alterado
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400">
                      Intacto
                    </span>
                  )}
                </div>

                {/* Side-by-side comparison boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Delivery side */}
                  <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                      Na Entrega
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-black inline-block border w-fit ${getConditionBadgeClass(item.delivery?.condition)}`}>
                      {item.delivery ? CONDITION_LABELS[item.delivery.condition] : 'N/A'}
                      {item.delivery?.quantityFound !== undefined && item.delivery?.quantityFound !== null
                        ? ` (${item.delivery.quantityFound})`
                        : ''}
                    </span>
                    {item.delivery?.notes && (
                      <p className="text-xs text-slate-300 italic pt-1">
                        &quot;{item.delivery.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Return side */}
                  <div className={`rounded-2xl p-4 flex flex-col gap-2 border ${
                    item.changed
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : 'bg-slate-950/70 border-white/5'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                      Na Devolução
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-black inline-block border w-fit ${getConditionBadgeClass(item.return?.condition)}`}>
                      {item.return ? CONDITION_LABELS[item.return.condition] : 'N/A'}
                      {item.return?.quantityFound !== undefined && item.return?.quantityFound !== null
                        ? ` (${item.return.quantityFound})`
                        : ''}
                    </span>
                    {item.return?.notes && (
                      <p className="text-xs text-rose-200 italic pt-1">
                        &quot;{item.return.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

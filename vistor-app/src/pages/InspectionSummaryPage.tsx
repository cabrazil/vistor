import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Inspection } from '../types';
import { CONDITION_LABELS } from '../types';

export default function InspectionSummaryPage() {
  const { id: inspectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [confirmedByName, setConfirmedByName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspectionId) return;
    setIsLoading(true);

    api.get<Inspection>(`/inspections/${inspectionId}`)
      .then((data) => {
        setInspection(data);
        if (data.confirmedByName) setConfirmedByName(data.confirmedByName);
        if (data.notes) setGeneralNotes(data.notes);
        if (data.status === 'COMPLETED') setIsCompleted(true);
      })
      .catch((err) => {
        console.error(err);
        setError('Não foi possível carregar o resumo da vistoria.');
      })
      .finally(() => setIsLoading(false));
  }, [inspectionId]);

  const results = inspection?.results || [];

  // Summary counts
  const counts = useMemo(() => {
    const res = {
      OK: 0,
      CAVEAT: 0,
      DAMAGED: 0,
      MISSING: 0,
      NA: 0,
    };
    results.forEach((r) => {
      if (res[r.condition] !== undefined) {
        res[r.condition]++;
      }
    });
    return res;
  }, [results]);

  // Flagged items (anything with caveats, damages, or missing)
  const flaggedItems = useMemo(() => {
    return results.filter((r) => r.condition !== 'OK' && r.condition !== 'NA');
  }, [results]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionId) return;

    if (!confirmedByName.trim()) {
      setError('Por favor, informe o nome do morador/responsável que acompanhou.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/inspections/${inspectionId}/complete`, {
        confirmedByName: confirmedByName.trim(),
        notes: generalNotes.trim() || undefined,
      });
      setIsCompleted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao finalizar a vistoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Carregando resumo...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-dvh text-slate-100 p-6 flex flex-col items-center justify-center">
        <p className="text-rose-400 mb-4 font-semibold">{error || 'Vistoria não encontrada.'}</p>
        <Link to="/" className="px-5 py-2.5 bg-slate-800 rounded-2xl text-xs font-bold">Voltar</Link>
      </div>
    );
  }

  // Success View after Completion
  if (isCompleted) {
    return (
      <div className="min-h-dvh text-slate-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-sm w-full">
          <div className="relative inline-flex mx-auto">
            <div className="absolute -inset-2 bg-emerald-500/30 rounded-3xl blur-xl animate-pulse-subtle" />
            <div className="relative w-22 h-22 rounded-3xl bg-slate-900 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-2xl">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Vistoria Finalizada!</h1>
            <p className="text-slate-400 text-sm mt-2">
              A vistoria de {inspection.type === 'DELIVERY' ? 'entrega' : 'devolução'} do{' '}
              <strong className="text-white">{inspection.reservation.unit}</strong> foi validada e gravada com sucesso.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 text-left text-xs space-y-1.5 border-white/5">
            <div className="flex justify-between text-slate-400">
              <span>Espaço:</span>
              <strong className="text-white">{inspection.reservation.area.name}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Confirmado por:</span>
              <strong className="text-white">{confirmedByName || inspection.confirmedByName}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">Assinado Digitalmente ✓</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate(`/reservations/${inspection.reservation.id}`)}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98]"
            >
              Ver Detalhes da Reserva
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 glass-panel text-slate-300 hover:text-white font-bold rounded-2xl text-xs transition-all border border-white/5"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center pb-16 w-full">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 sm:px-6 py-4">
        <div className="max-w-3xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/inspections/${inspectionId}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar aos itens
          </button>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-indigo-300">
            Resumo da Vistoria
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Header Info */}
        <div className="glass-card rounded-3xl p-7 sm:p-8 border-white/10 flex flex-col gap-2 shadow-2xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block">
            {inspection.type === 'DELIVERY' ? 'Vistoria de Entrega' : 'Vistoria de Devolução'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {inspection.reservation.unit}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {inspection.reservation.area.name} • Responsável: <strong className="text-slate-200">{inspection.reservation.responsibleName}</strong>
          </p>
        </div>

        {/* Counter Summary Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          <div className="glass-card rounded-2xl p-4 text-center border-emerald-500/20 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">{counts.OK}</span>
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider">OK</span>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border-amber-500/20 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">{counts.CAVEAT}</span>
            <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Ressalvas</span>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border-rose-500/20 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 block">{counts.DAMAGED}</span>
            <span className="text-[10px] font-bold text-rose-300/80 uppercase tracking-wider">Danos</span>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border-purple-500/20 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-400 block">{counts.MISSING}</span>
            <span className="text-[10px] font-bold text-purple-300/80 uppercase tracking-wider">Ausentes</span>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center border-white/5 col-span-3 sm:col-span-1 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-400 block">{counts.NA}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">N/A</span>
          </div>
        </div>

        {/* Flagged Items Section */}
        {flaggedItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Itens com Apontamentos ({flaggedItems.length})
            </h2>
            <div className="flex flex-col gap-3">
              {flaggedItems.map((r) => (
                <div
                  key={r.id}
                  className="glass-card rounded-2xl p-5 flex flex-col gap-3 border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold block">
                        {r.inspectionItem.environment.name}
                      </span>
                      <strong className="text-base text-white font-bold">
                        {r.inspectionItem.name}
                      </strong>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-black border ${
                        r.condition === 'DAMAGED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose'
                          : r.condition === 'MISSING'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber'
                      }`}
                    >
                      {CONDITION_LABELS[r.condition]}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-slate-200 italic bg-slate-950/70 p-3 rounded-xl border border-white/5">
                      &quot;{r.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl glass-card border-emerald-500/30 text-center flex flex-col items-center gap-1.5">
            <span className="text-2xl">✨</span>
            <p className="text-xs sm:text-sm text-emerald-400 font-bold">
              Espaço em perfeito estado: nenhum item com avaria ou ressalva.
            </p>
          </div>
        )}

        {/* Electronic Confirmation Form */}
        <form onSubmit={handleComplete} className="flex flex-col gap-4 pt-2">
          <div className="glass-card rounded-3xl p-7 sm:p-8 flex flex-col gap-5 border-white/10 shadow-2xl">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Assinatura Eletrônica
              </span>
              <h2 className="text-xl font-black text-white">
                Confirmação e Entrega
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 block">
                Nome do Morador/Responsável que acompanhou <strong className="text-rose-400">*</strong>
              </label>
              <input
                type="text"
                required
                value={confirmedByName}
                onChange={(e) => setConfirmedByName(e.target.value)}
                placeholder="Ex: Maria Silva (ou morador presente)"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300 block">
                Observações Gerais da Vistoria <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <textarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                rows={2}
                placeholder="Algum comentário ou instrução final sobre o salão..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl text-sm sm:text-base transition-all shadow-xl shadow-emerald-600/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirmar e Concluir Vistoria</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

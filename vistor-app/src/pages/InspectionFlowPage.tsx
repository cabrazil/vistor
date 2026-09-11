import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getMediaUrl } from '../services/api';
import type {
  Inspection,
  Area,
  Environment,
  InspectionItem,
  ItemCondition,
  InspectionItemResult,
  InspectionPhoto,
} from '../types';
import { CONDITION_LABELS } from '../types';

interface ItemResultState {
  id?: string;
  condition: ItemCondition;
  notes: string;
  quantityFound?: number | null;
  photos: InspectionPhoto[];
}

export default function InspectionFlowPage() {
  const { id: inspectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [deliveryResults, setDeliveryResults] = useState<Record<string, InspectionItemResult>>({});
  const [resultsMap, setResultsMap] = useState<Record<string, ItemResultState>>({});

  const [currentEnvIdx, setCurrentEnvIdx] = useState(0);
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Inspection + Area Details
  useEffect(() => {
    if (!inspectionId) return;
    setIsLoading(true);

    api.get<Inspection>(`/inspections/${inspectionId}`)
      .then(async (insp) => {
        setInspection(insp);

        // Load existing results into state map
        const initialResults: Record<string, ItemResultState> = {};
        insp.results.forEach((r) => {
          initialResults[r.inspectionItem.id] = {
            id: r.id,
            condition: r.condition,
            notes: r.notes || '',
            quantityFound: r.quantityFound,
            photos: r.photos || [],
          };
        });
        setResultsMap(initialResults);

        // Load Area and its Environments with Items
        const areaData = await api.get<Area & { environments: (Environment & { items: InspectionItem[] })[] }>(
          `/areas/${insp.reservation.area.id}`
        );
        setArea(areaData);

        // If this is RETURN inspection, fetch DELIVERY inspection for reference comparison
        if (insp.type === 'RETURN') {
          try {
            const resDetail = await api.get<any>(`/reservations/${insp.reservation.id}`);
            const delivery = resDetail.inspections?.find((i: any) => i.type === 'DELIVERY');
            if (delivery) {
              const deliveryDetail = await api.get<Inspection>(`/inspections/${delivery.id}`);
              const dMap: Record<string, InspectionItemResult> = {};
              deliveryDetail.results.forEach((r) => {
                dMap[r.inspectionItem.id] = r;
              });
              setDeliveryResults(dMap);
            }
          } catch (e) {
            console.error('Failed to load delivery reference:', e);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        alert('Erro ao carregar os dados da vistoria.');
        navigate('/');
      })
      .finally(() => setIsLoading(false));
  }, [inspectionId, navigate]);

  const environments = (area as any)?.environments || [];
  const currentEnv = environments[currentEnvIdx];
  const currentItems = currentEnv?.items || [];
  const currentItem = currentItems[currentItemIdx];

  // All items flattened across all environments for total progress calculation
  const allItems = useMemo(() => {
    return environments.flatMap((e: any) => e.items || []);
  }, [environments]);

  const evaluatedCount = useMemo(() => {
    return allItems.filter((item: InspectionItem) => resultsMap[item.id]?.condition).length;
  }, [allItems, resultsMap]);

  const currentResult = currentItem ? resultsMap[currentItem.id] : undefined;

  // Save current item result to backend
  const saveCurrentResult = async (condition: ItemCondition, notes: string, quantityFound?: number | null) => {
    if (!currentItem || !inspectionId) return null;

    setIsSaving(true);
    setValidationError(null);

    // Optimistically update local state
    setResultsMap((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        condition,
        notes,
        quantityFound: quantityFound !== undefined ? quantityFound : prev[currentItem.id]?.quantityFound,
        photos: prev[currentItem.id]?.photos || [],
      },
    }));

    try {
      const saved = await api.post<InspectionItemResult>(`/inspections/${inspectionId}/results`, {
        inspectionItemId: currentItem.id,
        condition,
        notes: notes || null,
        quantityFound: quantityFound !== undefined ? quantityFound : (currentItem.expectedQuantity ?? null),
      });

      setResultsMap((prev) => ({
        ...prev,
        [currentItem.id]: {
          id: saved.id,
          condition: saved.condition,
          notes: saved.notes || '',
          quantityFound: saved.quantityFound,
          photos: prev[currentItem.id]?.photos || [],
        },
      }));
      return saved;
    } catch (err: any) {
      console.error('Save error:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleConditionSelect = (condition: ItemCondition) => {
    const currentNotes = currentResult?.notes || '';
    const currentQty = currentResult?.quantityFound ?? currentItem.expectedQuantity;
    saveCurrentResult(condition, currentNotes, currentQty);
  };

  const handleNotesChange = (notes: string) => {
    if (!currentResult?.condition) return;
    setResultsMap((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        notes,
      },
    }));
  };

  const handleNotesBlur = () => {
    if (currentResult?.condition) {
      saveCurrentResult(currentResult.condition, currentResult.notes, currentResult.quantityFound);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!currentItem) return;
    const currentVal = currentResult?.quantityFound ?? currentItem.expectedQuantity ?? 0;
    const newVal = Math.max(0, currentVal + delta);
    const cond = currentResult?.condition || 'OK';
    saveCurrentResult(cond, currentResult?.notes || '', newVal);
  };

  // Photo Capture & Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentItem || !inspectionId) return;

    setIsUploadingPhoto(true);

    try {
      let resultId = currentResult?.id;
      if (!resultId) {
        const saved = await saveCurrentResult(
          currentResult?.condition || 'CAVEAT',
          currentResult?.notes || '',
          currentResult?.quantityFound
        );
        resultId = saved?.id;
      }

      if (!resultId) throw new Error('Não foi possível salvar o resultado antes do upload');

      const uploadedPhoto = await api.upload<InspectionPhoto>(
        `/inspections/${inspectionId}/results/${resultId}/photos`,
        file
      );

      setResultsMap((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...prev[currentItem.id],
          photos: [...(prev[currentItem.id]?.photos || []), uploadedPhoto],
        },
      }));
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert('Erro ao enviar foto: ' + (err.message || 'tente novamente'));
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!currentItem) return;
    if (!confirm('Deseja excluir esta foto?')) return;

    try {
      await api.delete(`/photos/${photoId}`);
      setResultsMap((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...prev[currentItem.id],
          photos: (prev[currentItem.id]?.photos || []).filter((p) => p.id !== photoId),
        },
      }));
    } catch (err: any) {
      console.error('Delete photo error:', err);
      alert('Erro ao excluir foto.');
    }
  };

  // Navigation handlers
  const canGoNext = () => {
    if (!currentResult?.condition) {
      setValidationError('Selecione uma condição para o item antes de avançar.');
      return false;
    }
    if ((currentResult.condition === 'DAMAGED' || currentResult.condition === 'MISSING') && !currentResult.notes.trim()) {
      setValidationError('Observação obrigatória para itens danificados ou ausentes.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    if (currentItemIdx < currentItems.length - 1) {
      setCurrentItemIdx((prev) => prev + 1);
    } else if (currentEnvIdx < environments.length - 1) {
      setCurrentEnvIdx((prev) => prev + 1);
      setCurrentItemIdx(0);
    } else {
      navigate(`/inspections/${inspectionId}/summary`);
    }
  };

  const handlePrev = () => {
    setValidationError(null);
    if (currentItemIdx > 0) {
      setCurrentItemIdx((prev) => prev - 1);
    } else if (currentEnvIdx > 0) {
      const prevEnvIdx = currentEnvIdx - 1;
      const prevItems = environments[prevEnvIdx]?.items || [];
      setCurrentEnvIdx(prevEnvIdx);
      setCurrentItemIdx(Math.max(0, prevItems.length - 1));
    }
  };

  const isLastOverall =
    currentEnvIdx === environments.length - 1 && currentItemIdx === currentItems.length - 1;
  const isFirstOverall = currentEnvIdx === 0 && currentItemIdx === 0;

  if (isLoading || !inspection || !currentItem) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Carregando vistoria...</p>
      </div>
    );
  }

  const deliveryRef = deliveryResults[currentItem.id];
  const progressPercent = allItems.length > 0 ? Math.round((evaluatedCount / allItems.length) * 100) : 0;
  const photos = currentResult?.photos || [];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between select-none w-full pb-4">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10">
        <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate(`/reservations/${inspection.reservation.id}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sair
          </button>

          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                inspection.type === 'DELIVERY'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              {inspection.type === 'DELIVERY' ? 'ENTREGA' : 'DEVOLUÇÃO'}
            </span>
            <span className="text-xs text-white font-bold">
              {inspection.reservation.unit}
            </span>
          </div>

          <button
            onClick={() => navigate(`/inspections/${inspectionId}/summary`)}
            className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
          >
            Resumo ({evaluatedCount}/{allItems.length})
          </button>
        </div>

        {/* Gradient Progress Bar */}
        <div className="w-full bg-slate-900/80 h-1.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 glow-emerald"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Environment Horizontal Tabs */}
        <div className="w-full bg-slate-950/60 border-t border-white/5">
          <div className="max-w-3xl w-full mx-auto flex overflow-x-auto no-scrollbar py-2.5 px-4 sm:px-6 gap-2.5">
            {environments.map((env: any, idx: number) => {
              const envItems = env.items || [];
              const envEvaluated = envItems.filter((i: any) => resultsMap[i.id]?.condition).length;
              const isCompleted = envEvaluated === envItems.length && envItems.length > 0;
              const isCurrent = idx === currentEnvIdx;

              return (
                <button
                  key={env.id}
                  onClick={() => {
                    setCurrentEnvIdx(idx);
                    setCurrentItemIdx(0);
                    setValidationError(null);
                  }}
                  className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'glass-panel text-slate-400 hover:text-white border-white/5'
                  }`}
                >
                  <span>{env.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isCurrent
                        ? 'bg-indigo-700 text-white'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : `${envEvaluated}/${envItems.length}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Inspection Card Area ──────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center my-auto gap-6">
        {/* Environment & Item Index Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            {currentEnv.name}
          </span>
          <span className="font-semibold bg-slate-900 px-3 py-1 rounded-full border border-white/10 text-slate-300">
            Item <strong className="text-white">{currentItemIdx + 1}</strong> de {currentItems.length}
          </span>
        </div>

        {/* Item Card */}
        <div className="glass-card rounded-3xl p-7 sm:p-8 border-white/10 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Item Name + Quantity Stepper */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
              {currentItem.name}
            </h2>

            {currentItem.hasQuantity && (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl shrink-0 shadow-inner">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Qtd:</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center text-sm active:scale-95 transition-transform"
                >
                  -
                </button>
                <span className="text-base font-black text-white px-1.5 min-w-[24px] text-center">
                  {currentResult?.quantityFound ?? currentItem.expectedQuantity ?? 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center text-sm active:scale-95 transition-transform"
                >
                  +
                </button>
                {currentItem.expectedQuantity && (
                  <span className="text-[11px] text-slate-500 font-bold">
                    /{currentItem.expectedQuantity}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* RETURN REFERENCE BANNER (If Devolução) */}
          {inspection.type === 'RETURN' && (
            <div className="bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 rounded-2xl p-4 text-xs space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-purple-300 text-[10px] flex items-center gap-1.5">
                  🔍 Referência Registrada na Entrega:
                </span>
                {deliveryRef ? (
                  <span className={`px-2.5 py-0.5 rounded-lg font-black text-xs border ${
                    deliveryRef.condition === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {CONDITION_LABELS[deliveryRef.condition]}
                    {deliveryRef.quantityFound !== null && deliveryRef.quantityFound !== undefined
                      ? ` (${deliveryRef.quantityFound} un)`
                      : ''}
                  </span>
                ) : (
                  <span className="text-slate-400">Sem registro prévio</span>
                )}
              </div>
              {deliveryRef?.notes && (
                <p className="text-slate-300 italic text-xs bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
                  &quot;{deliveryRef.notes}&quot;
                </p>
              )}
            </div>
          )}

          {/* Condition Selector Buttons */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Selecione o Estado do Item
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* OK */}
              <button
                type="button"
                onClick={() => handleConditionSelect('OK')}
                className={`py-4 px-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border ${
                  currentResult?.condition === 'OK'
                    ? 'bg-emerald-600 text-white border-emerald-400 glow-emerald scale-[1.03]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-white/10'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-black">
                  ✓
                </span>
                OK
              </button>

              {/* Ressalva */}
              <button
                type="button"
                onClick={() => handleConditionSelect('CAVEAT')}
                className={`py-4 px-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border ${
                  currentResult?.condition === 'CAVEAT'
                    ? 'bg-amber-600 text-white border-amber-400 glow-amber scale-[1.03]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-white/10'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-black">
                  !
                </span>
                Ressalva
              </button>

              {/* Danificado */}
              <button
                type="button"
                onClick={() => handleConditionSelect('DAMAGED')}
                className={`py-4 px-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border ${
                  currentResult?.condition === 'DAMAGED'
                    ? 'bg-rose-600 text-white border-rose-400 glow-rose scale-[1.03]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-white/10'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 text-xs font-black">
                  ✕
                </span>
                Danificado
              </button>

              {/* Ausente */}
              <button
                type="button"
                onClick={() => handleConditionSelect('MISSING')}
                className={`py-4 px-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border ${
                  currentResult?.condition === 'MISSING'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 scale-[1.03]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-white/10'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-black">
                  ?
                </span>
                Ausente
              </button>

              {/* N/A */}
              <button
                type="button"
                onClick={() => handleConditionSelect('NA')}
                className={`py-4 px-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border col-span-2 sm:col-span-1 ${
                  currentResult?.condition === 'NA'
                    ? 'bg-slate-700 text-white border-slate-500 scale-[1.03]'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-white/10'
                }`}
              >
                <span>—</span>
                N/A
              </button>
            </div>
          </div>

          {/* Observation Note Field */}
          {currentResult?.condition && (
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between px-1">
                <span>
                  Observação
                  {(currentResult.condition === 'DAMAGED' || currentResult.condition === 'MISSING') && (
                    <strong className="text-rose-400 ml-1.5">* OBRIGATÓRIA</strong>
                  )}
                  {currentResult.condition === 'CAVEAT' && (
                    <span className="text-amber-400 text-[11px] ml-1.5 font-normal">(descreva o detalhe)</span>
                  )}
                </span>
                {isSaving && <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Gravando...</span>}
              </label>

              <textarea
                value={currentResult.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleNotesBlur}
                rows={2}
                placeholder={
                  currentResult.condition === 'DAMAGED'
                    ? 'Descreva o dano encontrado (ex: tampo trincado, perna solta)...'
                    : currentResult.condition === 'CAVEAT'
                    ? 'Descreva a ressalva observada...'
                    : 'Observação opcional...'
                }
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-inner"
              />
            </div>
          )}

          {/* Photos Capture & Thumbnail Strip */}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fotos ({photos.length})
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-bold text-indigo-300 border border-indigo-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <span>{isUploadingPhoto ? 'Enviando Foto...' : 'Tirar Foto'}</span>
              </button>
            </div>

            {photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {photos.map((p) => (
                  <div key={p.id} className="relative group shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-md">
                    <img
                      src={getMediaUrl(p.url)}
                      alt="Foto do item"
                      onClick={() => setSelectedPhotoPreview(getMediaUrl(p.url))}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-950/80 text-rose-400 hover:text-rose-300 flex items-center justify-center text-xs font-black shadow-lg"
                      title="Excluir foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
              <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky Bottom Action Bar ───────────────────────────────── */}
      <footer className="sticky bottom-0 z-30 w-full glass-panel border-t border-white/10 p-4 sm:p-5">
        <div className="max-w-3xl w-full mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirstOverall}
            className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 font-bold flex items-center justify-center transition-all border border-white/10 active:scale-95 shadow-md shrink-0"
            title="Item anterior"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className={`flex-1 h-14 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] ${
              isLastOverall
                ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
            }`}
          >
            <span>{isLastOverall ? 'Finalizar Vistoria' : 'Próximo Item'}</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>

      {/* Lightbox / Fullscreen Photo Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-lg w-full">
            <img
              src={selectedPhotoPreview}
              alt="Foto ampliada"
              className="w-full max-h-[85vh] object-contain rounded-3xl border border-white/10 shadow-2xl"
            />
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/90 border border-white/20 text-white flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

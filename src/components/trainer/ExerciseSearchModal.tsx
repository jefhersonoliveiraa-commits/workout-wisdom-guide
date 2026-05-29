import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { searchExercises, type ExerciseSuggestion } from "@/lib/exerciseApi";
import { Input } from "@/components/ui/input";

interface ExerciseSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string, muscle: string) => void;
}

export function ExerciseSearchModal({ open, onClose, onSelect }: ExerciseSearchModalProps) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ExerciseSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTerm("");
      setResults([]);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await searchExercises(term);
      setResults(r);
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [term]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg2 border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar (em inglês: bench, squat, curl...)"
            className="flex-1 text-[13px] border-0 bg-transparent focus-visible:ring-0 px-0"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
            </div>
          )}

          {!loading && term.trim().length < 2 && (
            <p className="text-center text-[12px] text-muted-foreground py-6 px-4">
              Digite ao menos 2 letras. A base de exercícios do Wger está em inglês — o nome pode ser editado depois.
            </p>
          )}

          {!loading && term.trim().length >= 2 && results.length === 0 && (
            <p className="text-center text-[13px] text-muted-foreground py-6">
              Nenhum exercício encontrado.
            </p>
          )}

          {results.map((r) => (
            <button
              key={`${r.id}-${r.name}`}
              onClick={() => {
                onSelect(r.name, r.category ?? "");
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-bg3 transition-colors text-left"
            >
              {r.image ? (
                <img
                  src={r.image}
                  alt=""
                  loading="lazy"
                  className="w-10 h-10 rounded object-cover bg-bg4 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-bg4 flex items-center justify-center text-[16px] flex-shrink-0">
                  🏋️
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{r.name}</div>
                {r.category && <div className="text-[11px] text-muted-foreground">{r.category}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

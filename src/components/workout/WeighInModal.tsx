import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveBodyWeight, getLatestBodyWeight } from "@/lib/bodyWeight";

interface WeighInModalProps {
  isOpen: boolean;
  studentId: string;
  heightM: number | null;
  onClose: () => void;
  onDismiss: () => void;
}

export function WeighInModal({ isOpen, studentId, heightM, onClose, onDismiss }: WeighInModalProps) {
  const queryClient = useQueryClient();
  const { data: latest } = useQuery({
    queryKey: ['latest-body-weight', studentId],
    queryFn: () => getLatestBodyWeight(studentId),
    enabled: isOpen,
  });

  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 30 || w > 300) return;
    await saveBodyWeight(w, studentId, heightM);
    queryClient.invalidateQueries({ queryKey: ['latest-body-weight', studentId] });
    queryClient.invalidateQueries({ queryKey: ['body-weight-history', studentId] });
    queryClient.invalidateQueries({ queryKey: ['weight-change', studentId] });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setWeight("");
      onClose();
    }, 1800);
  };

  const h = heightM ?? 1.7;
  const bmiPreview = weight ? (parseFloat(weight) / (h * h)).toFixed(1) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onDismiss} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-bg3 border border-border-bright rounded-lg p-6 w-full max-w-sm z-10"
          >
            {!saved ? (
              <>
                <div className="text-center mb-5">
                  <div className="text-[32px] mb-2">⚖️</div>
                  <h2 className="text-[18px] font-semibold text-foreground">Check-in de Peso</h2>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                    Já se passaram 2 semanas! Registre seu peso atual para acompanhar sua evolução.
                  </p>
                </div>

                {latest && (
                  <div className="bg-bg4 rounded-sm p-3 mb-4 text-center">
                    <span className="text-[11px] text-muted-foreground">Último registro: </span>
                    <span className="text-[14px] font-mono font-semibold text-primary">{latest.weight}kg</span>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      ({new Date(latest.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })})
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Ex: 95.5"
                    className="flex-1 bg-bg2 border border-border rounded-sm p-3 text-[18px] font-mono text-foreground text-center outline-none focus:border-primary transition-colors"
                    autoFocus
                  />
                  <span className="text-[14px] text-muted-foreground font-medium">kg</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onDismiss}
                    className="flex-1 bg-bg4 border border-border rounded-sm py-3 text-[13px] text-muted-foreground font-medium transition-colors hover:text-foreground"
                  >
                    Depois
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-primary text-primary-foreground rounded-sm py-3 text-[13px] font-semibold transition-colors hover:bg-primary/90"
                  >
                    Registrar
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  💡 Dica: pese-se de manhã, em jejum, após ir ao banheiro.
                </p>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="text-[48px] mb-3">✅</div>
                <h2 className="text-[18px] font-semibold text-foreground mb-1">Peso registrado!</h2>
                <p className="text-[14px] font-mono text-primary">{weight}kg</p>
                {bmiPreview && (
                  <p className="text-[12px] text-muted-foreground mt-2">IMC: {bmiPreview}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

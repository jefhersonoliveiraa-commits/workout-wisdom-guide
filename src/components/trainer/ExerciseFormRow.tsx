import { useState } from "react";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseSearchModal } from "@/components/trainer/ExerciseSearchModal";

export interface ExerciseFormData {
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  rir: string;
  suggested_load: string;
  technique: string;
  description: string;
  warnings: string;
}

interface ExerciseFormRowProps {
  index: number;
  value: ExerciseFormData;
  onChange: (index: number, data: ExerciseFormData) => void;
  onRemove: (index: number) => void;
}

export function ExerciseFormRow({ index, value, onChange, onRemove }: ExerciseFormRowProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const update = (field: keyof ExerciseFormData, v: string | number) =>
    onChange(index, { ...value, [field]: v });

  const handlePick = (name: string, muscle: string) =>
    onChange(index, { ...value, name, muscle: muscle || value.muscle });

  return (
    <div className="bg-bg3 border border-border rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-primary uppercase tracking-wider">
          Exercício {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label className="text-[11px]">Nome do exercício *</Label>
          <div className="flex gap-2">
            <Input value={value.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Supino Reto com Barra" className="text-[13px] flex-1" />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Buscar no banco de exercícios"
              className="px-3 rounded-md border border-border bg-bg2 text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1.5 text-[12px] flex-shrink-0"
            >
              <Search size={14} />
              Buscar
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Músculo</Label>
          <Input value={value.muscle} onChange={e => update('muscle', e.target.value)} placeholder="Ex: Peitoral" className="text-[13px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Séries *</Label>
          <Input type="number" value={value.sets} onChange={e => update('sets', parseInt(e.target.value) || 3)} min={1} max={10} className="text-[13px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Repetições *</Label>
          <Input value={value.reps} onChange={e => update('reps', e.target.value)} placeholder="Ex: 8–12" className="text-[13px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Descanso *</Label>
          <Input value={value.rest} onChange={e => update('rest', e.target.value)} placeholder="Ex: 2 min" className="text-[13px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">RIR</Label>
          <Input value={value.rir} onChange={e => update('rir', e.target.value)} placeholder="Ex: RIR 2" className="text-[13px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Carga sugerida (kg)</Label>
          <Input type="number" value={value.suggested_load} onChange={e => update('suggested_load', e.target.value)} placeholder="Ex: 60" className="text-[13px]" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-[11px]">Descrição / orientação de execução</Label>
          <textarea
            value={value.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Como executar corretamente..."
            rows={2}
            className="w-full bg-bg2 border border-border rounded-[6px] px-3 py-2 text-[13px] text-foreground outline-none focus:border-primary transition-colors resize-none"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-[11px]">Técnica avançada (opcional)</Label>
          <Input value={value.technique} onChange={e => update('technique', e.target.value)} placeholder="Ex: Rest-pause na última série" className="text-[13px]" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-[11px]">Alertas (separar por vírgula)</Label>
          <Input value={value.warnings} onChange={e => update('warnings', e.target.value)} placeholder="Ex: Ombro, Lombar" className="text-[13px]" />
        </div>
      </div>

      <ExerciseSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handlePick}
      />
    </div>
  );
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  rpe?: string;
  warnings: string[];
  description: string;
}

export interface CoreExercise {
  icon: string;
  name: string;
  description: string;
}

export interface TrainingDay {
  dayIndex: number;
  dayLabel: string;
  shortLabel: string;
  title: string;
  colorClass: "primary" | "blue" | "orange" | "teal" | "pink" | "yellow";
  tags: string[];
  totalExercises: number;
  totalSets: number;
  estimatedTime: string;
  isRest: boolean;
  warning?: { title: string; text: string };
  exercises: Exercise[];
  core: CoreExercise[];
  restInfo?: { title: string; items: string[] }[];
}

export const trainingDays: TrainingDay[] = [
  {
    dayIndex: 0,
    dayLabel: "Segunda-feira",
    shortLabel: "Seg",
    title: "Upper Push",
    colorClass: "primary",
    tags: ["Peito", "Deltoide", "Tríceps", "Manguito Rotador"],
    totalExercises: 5,
    totalSets: 16,
    estimatedTime: "~55",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Ombro esquerdo",
      text: "Monitore o ombro esquerdo em todos os exercícios de empurrar. Se sentir dor (não apenas desconforto muscular), pare e reduza a carga ou amplitude. Nunca force além do conforto.",
    },
    exercises: [
      {
        id: "0-0", name: "Supino Inclinado com Halteres",
        muscle: "Peitoral superior · Deltoide anterior · Tríceps",
        sets: 4, reps: "8–12", rest: "90s", rpe: "RPE 7–8",
        warnings: ["⚠ ombro"],
        description: "Prefira halteres à barra — permite rotação neutra do punho e reduz tensão no ombro esquerdo. Inclinação de 30–45°. Desça de forma controlada em ~2s, cuidado ao cruzar a linha do ombro. Cotovelos a ~45° do tronco.",
      },
      {
        id: "0-1", name: "Crucifixo na Polia Baixa (cabos)",
        muscle: "Peitoral médio · Porção esternal",
        sets: 3, reps: "12–15", rest: "60s",
        warnings: ["⚠ ombro"],
        description: "Corda mantida abaixo da altura do ombro. Evite adução acima de 90° no ombro esquerdo. Movimento contínuo e controlado — excelente para tensão na porção longa do peitoral sem carga excessiva no ombro.",
      },
      {
        id: "0-2", name: "Elevação Lateral com Halter (unilateral)",
        muscle: "Deltoide lateral",
        sets: 3, reps: "15–20", rest: "60s",
        warnings: ["⚠ ombro — carga leve"],
        description: "Execute o braço esquerdo com carga leve e amplitude reduzida (máx 60–70° de abdução). Nenhuma dor = pode aumentar gradualmente a amplitude nas semanas seguintes. Cotovelo levemente flexionado.",
      },
      {
        id: "0-3", name: "Tríceps Corda na Polia Alta",
        muscle: "Tríceps braquial",
        sets: 3, reps: "12–15", rest: "60s",
        warnings: [],
        description: "Cotovelos fixos ao lado do tronco. Não ultrapasse a amplitude de conforto do ombro esquerdo. Excelente para tríceps sem sobrecarga no ombro.",
      },
      {
        id: "0-4", name: "Rotação Externa com Elástico / Polia",
        muscle: "Manguito rotador — infraespinhoso e redondo menor",
        sets: 3, reps: "15", rest: "sem descanso entre lados",
        warnings: ["reabilitador — essencial"],
        description: "Exercício de reforço e prevenção para o ombro esquerdo. Cotovelo a 90° e colado ao lado do corpo. Carga muito leve — foco é na ativação do manguito rotador.",
      },
    ],
    core: [
      { icon: "🔲", name: "Prancha Frontal", description: "3 × 20–30s (progride até 45s). Coluna neutra, core ativado." },
      { icon: "🦅", name: "Bird-Dog", description: "3 × 10 por lado. Braço e perna opostos, lombar neutra." },
    ],
  },
  {
    dayIndex: 1,
    dayLabel: "Terça-feira",
    shortLabel: "Ter",
    title: "Lower A",
    colorClass: "blue",
    tags: ["Quadríceps", "Glúteo", "Core", "Panturrilha"],
    totalExercises: 5,
    totalSets: 17,
    estimatedTime: "~60",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Lombar",
      text: "Mantenha o core ativado em todos os exercícios. Evite arredondar a lombar. Em caso de dor lombar aguda, substitua o exercício pelo leg press ou cadeira extensora.",
    },
    exercises: [
      {
        id: "1-0", name: "Leg Press 45°",
        muscle: "Quadríceps · Glúteo máximo · Isquiotibiais",
        sets: 4, reps: "10–15", rest: "90s", rpe: "RPE 7–8",
        warnings: ["⚠ lombar — encosto"],
        description: "Prefira ao agachamento livre inicialmente pela lombar. Pés na largura dos ombros, levemente abduzidos. Joelhos alinhados com os pés. Desça até ~90° de flexão. Lombar em contato com o encosto o tempo todo.",
      },
      {
        id: "1-1", name: "Agachamento Goblet com Halter",
        muscle: "Quadríceps · Glúteo · Core",
        sets: 3, reps: "12", rest: "90s",
        warnings: ["⚠ lombar — tronco ereto"],
        description: "Halter segurado no peito ajuda a manter o tronco ereto e reduz a carga na lombar. Ótima transição para o agachamento livre futuro. Core ativado durante todo o movimento.",
      },
      {
        id: "1-2", name: "Extensora de Pernas (cadeira extensora)",
        muscle: "Quadríceps isolado",
        sets: 3, reps: "15–20", rest: "60s",
        warnings: [],
        description: "Isolamento de quadríceps com zero carga espinhal — ideal para o perfil com lombar sensível. Evite a hiperextensão completa do joelho. Controle a fase excêntrica em ~2s.",
      },
      {
        id: "1-3", name: "Elevação de Quadril (Hip Thrust)",
        muscle: "Glúteo máximo · Isquiotibiais proximais",
        sets: 4, reps: "12–15", rest: "90s",
        warnings: ["⚠ pelve neutra no topo"],
        description: "Posicione a carga sobre o quadril com proteção (toalha ou pad). Pelve neutra no topo — não hiperextenda a lombar. Empurre pelos calcanhares.",
      },
      {
        id: "1-4", name: "Panturrilha em Pé (máquina ou escada)",
        muscle: "Gastrocnêmio · Sóleo",
        sets: 3, reps: "15–20", rest: "60s",
        warnings: [],
        description: "Amplitude total — calcanhar abaixo do degrau para o alongamento, suba até a ponta dos pés. Core ativado.",
      },
    ],
    core: [
      { icon: "🐛", name: "Dead Bug", description: "3 × 10 por lado. Costas no chão, coluna neutra durante todo o movimento." },
      { icon: "🍑", name: "Glute Bridge no Chão", description: "3 × 15. Fortalece glúteo e estabilizadores lombares sem carga axial." },
    ],
  },
  {
    dayIndex: 2,
    dayLabel: "Quarta-feira",
    shortLabel: "Qua",
    title: "Upper Pull",
    colorClass: "teal",
    tags: ["Costas", "Bíceps", "Deltoide Posterior", "Trapézio"],
    totalExercises: 5,
    totalSets: 17,
    estimatedTime: "~55",
    isRest: false,
    exercises: [
      {
        id: "2-0", name: "Puxada Frontal Aberta (Lat Pulldown)",
        muscle: "Latíssimo do dorso · Bíceps · Romboides",
        sets: 4, reps: "10–12", rest: "90s", rpe: "RPE 7–8",
        warnings: ["⚠ monitor ombro"],
        description: "Pegada pronada, levemente mais larga que os ombros. Puxe até a parte superior do peito com o tronco levemente inclinado para trás. Se houver desconforto no ombro esquerdo, reduza a pegada.",
      },
      {
        id: "2-1", name: "Remada Cavalinho (baixa polia)",
        muscle: "Costas médias · Romboides · Trapézio",
        sets: 4, reps: "12", rest: "90s",
        warnings: ["⚠ lombar — core ativado"],
        description: "Tronco reto, puxe em direção ao umbigo. Omoplatas retraídas no final do movimento. Core ativado para proteger a lombar.",
      },
      {
        id: "2-2", name: "Remada Unilateral com Halter",
        muscle: "Latíssimo · Romboides · Bíceps",
        sets: 3, reps: "12 cada lado", rest: "60s",
        warnings: ["⚠ lombar — apoio"],
        description: "Apoio de mão e joelho no banco — posição que descarrega a lombar. Puxe o cotovelo para trás e para cima. Controle a descida em 2s.",
      },
      {
        id: "2-3", name: "Rosca Direta com Barra EZ",
        muscle: "Bíceps braquial · Braquialis",
        sets: 3, reps: "10–12", rest: "60s",
        warnings: ["⚠ lombar — sem balançar"],
        description: "Barra EZ reduz tensão no punho e cotovelo. Cotovelos fixos ao lado do corpo. Sem balançar o tronco — isso sobrecarrega a lombar.",
      },
      {
        id: "2-4", name: "Elevação Frontal com Disco",
        muscle: "Deltoide anterior · Fascículo médio",
        sets: 3, reps: "12–15", rest: "60s",
        warnings: ["⚠ ombro — até a altura"],
        description: "Segure o disco com as duas mãos — distribui a carga igualmente e reduz tensão isolada no ombro esquerdo. Eleve até a altura dos ombros (não acima).",
      },
    ],
    core: [
      { icon: "🔲", name: "Prancha Lateral", description: "3 × 20s por lado. Quadril elevado, corpo reto. Progride até 35s." },
      { icon: "🦅", name: "Bird-Dog", description: "3 × 10 por lado. Braço e perna opostos, lombar neutra." },
    ],
  },
  {
    dayIndex: 3,
    dayLabel: "Quinta-feira",
    shortLabel: "Qui",
    title: "Lower B",
    colorClass: "orange",
    tags: ["Isquiotibiais", "Glúteo", "Abdutores", "Panturrilha"],
    totalExercises: 5,
    totalSets: 17,
    estimatedTime: "~55",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Stiff e Lombar",
      text: "No stiff (exercício 1), a coluna NUNCA deve arredondar. Use carga moderada e priorize a técnica. Em caso de dor lombar, substitua pela mesa flexora e hip thrust.",
    },
    exercises: [
      {
        id: "3-0", name: "Stiff (Levantamento Terra Romeno) com Halteres",
        muscle: "Isquiotibiais · Glúteo máximo · Eretores espinhais",
        sets: 4, reps: "10–12", rest: "90s", rpe: "RPE 6–7",
        warnings: ["⚠ lombar — ESSENCIAL"],
        description: "Use halteres em vez de barra para maior controle. Joelhos levemente flexionados, coluna neutra durante todo o movimento — NUNCA arredonde a lombar. Desça até sentir o alongamento dos isquiotibiais.",
      },
      {
        id: "3-1", name: "Mesa Flexora (leg curl deitado)",
        muscle: "Isquiotibiais — bíceps femoral",
        sets: 4, reps: "12–15", rest: "60s",
        warnings: [],
        description: "Isolamento de isquiotibiais sem carga na lombar. Movimento controlado — evite usar impulso. Quadril no banco durante todo o movimento.",
      },
      {
        id: "3-2", name: "Búlgaro (Split Squat) com Halter",
        muscle: "Glúteo · Quadríceps · Core",
        sets: 3, reps: "10 cada perna", rest: "90s",
        warnings: ["⚠ lombar — tronco ereto"],
        description: "Pé traseiro elevado no banco. Tronco ereto, core ativado. Joelho dianteiro alinhado com o pé. Excelente para glúteo e equilíbrio.",
      },
      {
        id: "3-3", name: "Abdutora na Máquina",
        muscle: "Glúteo médio · Tensor da fáscia lata",
        sets: 3, reps: "15–20", rest: "60s",
        warnings: [],
        description: "Movimento controlado, sem impulso. Boa ativação do glúteo médio — estabilizador importante para joelhos e lombar.",
      },
      {
        id: "3-4", name: "Panturrilha Sentado (máquina)",
        muscle: "Sóleo",
        sets: 3, reps: "20", rest: "45s",
        warnings: [],
        description: "Na posição sentada, o joelho flexionado recruta prioritariamente o sóleo. Amplitude completa — calcanhar abaixo, ponta acima. Sem carga na lombar.",
      },
    ],
    core: [
      { icon: "🐛", name: "Dead Bug", description: "3 × 10 por lado. Costas no chão, controle total da lombar." },
      { icon: "🍑", name: "Glute Bridge no Chão", description: "3 × 15. Reforço glúteo e estabilização lombar." },
    ],
  },
  {
    dayIndex: 4,
    dayLabel: "Sexta-feira",
    shortLabel: "Sex",
    title: "Upper Full",
    colorClass: "pink",
    tags: ["Volume extra", "Bíceps", "Tríceps", "Ombro — saúde"],
    totalExercises: 5,
    totalSets: 15,
    estimatedTime: "~50",
    isRest: false,
    exercises: [
      {
        id: "4-0", name: "Supino Plano com Halteres",
        muscle: "Peitoral médio · Tríceps",
        sets: 3, reps: "10–12", rest: "90s",
        warnings: ["⚠ ombro"],
        description: "Variante plana para estimular a porção medial do peitoral. Mesmo cuidado com o ombro esquerdo: amplitude controlada, sem forçar a rotação.",
      },
      {
        id: "4-1", name: "Puxada Neutra (pegada supinada)",
        muscle: "Latíssimo · Bíceps",
        sets: 3, reps: "10–12", rest: "90s",
        warnings: [],
        description: "Pegada supinada (palmas voltadas para você) é mais amigável para o ombro que a pronada. Puxe até o queixo, peito para frente.",
      },
      {
        id: "4-2", name: "Rosca Martelo (halteres alternados)",
        muscle: "Bíceps · Braquiorradial",
        sets: 3, reps: "12", rest: "60s",
        warnings: [],
        description: "Pegada neutra (polegar para cima). Alterne os braços para maior controle. Core ativado. Cotovelos fixos ao lado do corpo.",
      },
      {
        id: "4-3", name: "Tríceps Testa com Halteres",
        muscle: "Tríceps — cabeça longa",
        sets: 3, reps: "12", rest: "60s",
        warnings: ["⚠ ombro — monitor"],
        description: "Deitado no banco, halteres em pegada neutra. Flexão do cotovelo até próximo da testa. Se houver dor no ombro esquerdo, substitua por tríceps na corda.",
      },
      {
        id: "4-4", name: "Face Pull na Polia (corda)",
        muscle: "Deltoide posterior · Manguito rotador · Trapézio",
        sets: 3, reps: "15–20", rest: "60s",
        warnings: ["reabilitador — não pule"],
        description: "Essencial para a saúde do ombro — reforça o deltoide posterior e os rotadores externos. Polia na altura dos olhos, cotovelos acima dos ombros no final. Carga leve a moderada.",
      },
    ],
    core: [
      { icon: "🔲", name: "Prancha Frontal", description: "3 × 30–45s. Encerre a semana com estabilização lombar." },
      { icon: "🔲", name: "Prancha Lateral", description: "3 × 20–30s por lado. Quadril elevado e alinhado." },
    ],
  },
  {
    dayIndex: 5,
    dayLabel: "Sábado",
    shortLabel: "Sáb",
    title: "Descanso Ativo",
    colorClass: "yellow",
    tags: ["Recuperação", "Cardio leve"],
    totalExercises: 0,
    totalSets: 0,
    estimatedTime: "30–40",
    isRest: true,
    exercises: [],
    core: [],
    restInfo: [
      {
        title: "O que fazer hoje",
        items: [
          "Caminhada de 30–40 min em ritmo moderado",
          "Bicicleta ergométrica em baixa intensidade",
          "Mobilidade articular: quadril, ombros, tornozelos (10–15 min)",
          "Alongamento global dos músculos trabalhados na semana",
        ],
      },
      {
        title: "Por que o descanso ativo importa?",
        items: [
          "O ACSM recomenda 200–300 min/semana de atividade moderada para perda de gordura. O descanso ativo conta para essa meta sem interferir na recuperação muscular.",
        ],
      },
    ],
  },
  {
    dayIndex: 6,
    dayLabel: "Domingo",
    shortLabel: "Dom",
    title: "Descanso Completo",
    colorClass: "yellow",
    tags: ["Recuperação", "Sono"],
    totalExercises: 0,
    totalSets: 0,
    estimatedTime: "0",
    isRest: true,
    exercises: [],
    core: [],
    restInfo: [
      {
        title: "Hoje é dia de recuperar",
        items: [
          "O crescimento muscular e a queima de gordura acontecem durante o descanso, não durante o treino. Priorize sono de qualidade, hidratação e alimentação adequada.",
        ],
      },
      {
        title: "Dicas para o domingo",
        items: [
          "Durma pelo menos 7–8 horas",
          "Beba 2,5–3L de água",
          "Planeje as refeições da semana",
          "Se quiser, faça uma caminhada leve de 20 min",
        ],
      },
    ],
  },
];

export const progressionSteps = [
  { num: 1, title: "Semanas 1–3 — Aprendizado", text: "Fique na faixa inferior de repetições com cargas que você domine completamente. RPE máximo de 7 (3 repetições \"de sobra\"). Foco total em técnica." },
  { num: 2, title: "Semanas 4–6 — Progressão", text: "Quando atingir o limite superior de repetições com boa técnica em todas as séries, aumente a carga em ~2–5% na próxima sessão." },
  { num: 3, title: "Semanas 7–8 — Deload", text: "Reduza o volume em ~40% (menos séries), mantendo a intensidade. Permite recuperação estrutural sem perda de força. Obrigatório a cada 6–8 semanas." },
  { num: 4, title: "Cardio Complementar", text: "Adicione 3 × 30–40 min de cardio moderado (esteira, bicicleta, caminhada) nos sábados ou ao final dos treinos. Meta: 200–300 min/semana total." },
  { num: 5, title: "Ombro Esquerdo", text: "A cada 2 semanas, aumente levemente a carga ou amplitude — apenas se não houver dor. Progrida com cautela. Se a dor persistir, consulte um ortopedista." },
];

export const profileData = {
  age: 20,
  weight: "97kg",
  height: "1,68m",
  bmi: "34,4",
  goal: "Recomp. Corporal",
  warnings: [
    { title: "⚠ Ombro esquerdo (histórico de trauma)", text: "Evite: overhead press, upright row, bench dips e movimentos que forcem rotação interna. Inclua rotação externa e face pull em TODOS os dias de upper body. Consulte ortopedista para diagnóstico." },
    { title: "⚠ Lombar sensível", text: "Mantenha core ativado em todos os exercícios. Evite arredondar a lombar. Prefira leg press ao agachamento livre inicialmente. O bloco de core diário é preventivo e obrigatório." },
  ],
};

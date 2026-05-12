export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  rest: string;
  rir?: string;
  /** Técnica avançada aplicada na última série (drop set, rest-pause, myo-rep, pausa no alongamento). */
  technique?: string;
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

const shoulderWarn = "⚠ ombro esq.";
const lombarWarn = "⚠ lombar";

export const trainingDays: TrainingDay[] = [
  // ───────────── SEGUNDA — PUSH A ─────────────
  {
    dayIndex: 0,
    dayLabel: "Segunda-feira",
    shortLabel: "Seg",
    title: "Push A",
    colorClass: "primary",
    tags: ["Peito", "Ombro", "Tríceps"],
    totalExercises: 7,
    totalSets: 21,
    estimatedTime: "~70",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Ombro esquerdo",
      text: "Monitore o ombro esquerdo nos empurrar e elevações. Se houver dor (não desconforto muscular), reduza carga ou amplitude. RIR 2 nos compostos pesados.",
    },
    exercises: [
      {
        id: "0-0", name: "Supino inclinado halter (30–45°)",
        muscle: "Peitoral superior · Deltoide ant. · Tríceps",
        sets: 3, reps: "6–10", rest: "3 min", rir: "RIR 2",
        warnings: [shoulderWarn],
        description: "Halteres permitem rotação neutra do punho — mais amigável ao ombro. Inclinação 30–45°. Desça em ~2s, controle a amplitude.",
      },
      {
        id: "0-1", name: "Supino máquina (plate-loaded)",
        muscle: "Peitoral médio · Tríceps",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [shoulderWarn],
        description: "Trajetória guiada — bom para fadigar o peito sem demanda de estabilidade. Ajuste o banco para o cabo passar pela linha do mamilo.",
      },
      {
        id: "0-2", name: "Crucifixo cabo cruzado (alongado)",
        muscle: "Peitoral — porção esternal",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 1 → 0",
        technique: "Última série: pausa de 2s no alongamento em todas as reps",
        warnings: [shoulderWarn],
        description: "Cabos cruzados na altura média. Foque no alongamento profundo do peito — pausa de 2s na última série para maximizar tensão na fase hipertrófica.",
      },
      {
        id: "0-3", name: "Desenvolvimento máquina",
        muscle: "Deltoide anterior · Tríceps",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [shoulderWarn],
        description: "Prefira máquina convergente. Se overhead causar dor no ombro esq., reduza amplitude ou substitua por landmine press.",
      },
      {
        id: "0-4", name: "Elevação lateral cabo",
        muscle: "Deltoide lateral",
        sets: 4, reps: "12–20", rest: "1 min", rir: "RIR 0–1",
        technique: "Última série — MYO-REP: falha + 15s + 4–5 reps, repetir 1x",
        warnings: [],
        description: "Cabo na polia baixa, atrás do corpo. Carga leve, foco na contração — ombro lateral cresce com volume + reps altas.",
      },
      {
        id: "0-5", name: "Tríceps testa com barra EZ",
        muscle: "Tríceps — cabeça longa",
        sets: 3, reps: "8–12", rest: "2 min", rir: "RIR 1–2",
        warnings: [],
        description: "Deitado, barra EZ. Desça até a testa controlando a excêntrica em ~2s. Cotovelos não apontam para fora.",
      },
      {
        id: "0-6", name: "Tríceps corda na polia",
        muscle: "Tríceps — cabeça lateral",
        sets: 2, reps: "12–15", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — DROP SET: falha → tira 30% da carga → falha",
        warnings: [],
        description: "Cotovelos colados ao tronco. Abra a corda no final para contração máxima.",
      },
    ],
    core: [],
  },

  // ───────────── TERÇA — PULL A ─────────────
  {
    dayIndex: 1,
    dayLabel: "Terça-feira",
    shortLabel: "Ter",
    title: "Pull A",
    colorClass: "teal",
    tags: ["Dorsal", "Bíceps", "Deltoide post."],
    totalExercises: 7,
    totalSets: 21,
    estimatedTime: "~65",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Lombar na remada",
      text: "Na remada curvada, mantenha core ativado e coluna neutra. Se a lombar incomodar, troque por remada cavalinho com apoio no peito.",
    },
    exercises: [
      {
        id: "1-0", name: "Remada curvada barra (ou pendlay)",
        muscle: "Dorsal espessura · Romboides · Trapézio médio",
        sets: 3, reps: "6–10", rest: "3 min", rir: "RIR 2",
        warnings: [lombarWarn],
        description: "Tronco a ~30° do chão, coluna neutra. Puxe em direção ao umbigo. Pendlay = parte do chão a cada rep.",
      },
      {
        id: "1-1", name: "Puxada pronada cabo",
        muscle: "Latíssimo · Bíceps",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [],
        description: "Pegada pronada um pouco mais larga que ombros. Puxe até o peito superior, peito para cima.",
      },
      {
        id: "1-2", name: "Remada cavalinho ou serrote",
        muscle: "Latíssimo · Romboides",
        sets: 3, reps: "10–12", rest: "2 min", rir: "RIR 1",
        warnings: [],
        description: "Cavalinho com apoio no peito = lombar protegida. Puxe o cotovelo para trás e cima.",
      },
      {
        id: "1-3", name: "Pullover cabo (alongado)",
        muscle: "Latíssimo — porção longa",
        sets: 3, reps: "12–15", rest: "1,5 min", rir: "RIR 1 → 0",
        technique: "Última série: pausa de 2s no alongamento em todas as reps",
        warnings: [],
        description: "Polia alta, em pé. Braços levemente flexionados. Foco no alongamento do dorsal no início do movimento.",
      },
      {
        id: "1-4", name: "Face pull ou crucifixo invertido",
        muscle: "Deltoide post. · Manguito · Trapézio",
        sets: 3, reps: "12–20", rest: "1,5 min", rir: "RIR 0–1",
        warnings: ["reabilitador — não pule"],
        description: "Polia na altura dos olhos, cotovelos acima dos ombros no final. Essencial para saúde do ombro esquerdo.",
      },
      {
        id: "1-5", name: "Rosca direta barra W",
        muscle: "Bíceps braquial",
        sets: 3, reps: "8–12", rest: "2 min", rir: "RIR 1",
        warnings: [],
        description: "Barra W reduz tensão no punho. Cotovelos fixos ao lado, sem balançar o tronco.",
      },
      {
        id: "1-6", name: "Rosca inclinada halter (alongada)",
        muscle: "Bíceps — cabeça longa",
        sets: 3, reps: "10–12", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — REST-PAUSE: falha + 15s + reps + 15s + reps",
        warnings: [],
        description: "Banco a 60°, braços pendentes atrás do corpo. Posição alongada do bíceps — exercício chave para crescimento.",
      },
    ],
    core: [],
  },

  // ───────────── QUARTA — LEGS A ─────────────
  {
    dayIndex: 2,
    dayLabel: "Quarta-feira",
    shortLabel: "Qua",
    title: "Legs A",
    colorClass: "blue",
    tags: ["Quadríceps", "Posterior", "Panturrilha"],
    totalExercises: 6,
    totalSets: 20,
    estimatedTime: "~75",
    isRest: false,
    warning: {
      title: "⚠ Atenção — Lombar no agachamento",
      text: "Coluna neutra no agacha. Se lombar incomodar, prefira hack squat ou leg press. Stiff: NUNCA arredonde a lombar.",
    },
    exercises: [
      {
        id: "2-0", name: "Agachamento livre ou hack",
        muscle: "Quadríceps · Glúteo · Adutores",
        sets: 4, reps: "6–10", rest: "3–4 min", rir: "RIR 2",
        warnings: [lombarWarn],
        description: "Profundidade até a coxa paralela ou abaixo. Joelhos seguem a linha dos pés. Hack squat se a lombar pedir.",
      },
      {
        id: "2-1", name: "Leg press 45°",
        muscle: "Quadríceps · Glúteo",
        sets: 3, reps: "10–15", rest: "3 min", rir: "RIR 1–2",
        warnings: ["⚠ lombar — encosto"],
        description: "Pés na largura dos ombros. Desça até ~90° de flexão. Lombar grudada no encosto o tempo todo.",
      },
      {
        id: "2-2", name: "Cadeira extensora",
        muscle: "Quadríceps isolado",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — DROP SET: falha → tira 30% da carga → falha",
        warnings: [],
        description: "Isolamento de quadríceps. Controle a excêntrica em ~2s. Drop set finaliza o estímulo.",
      },
      {
        id: "2-3", name: "Stiff com halteres",
        muscle: "Isquiotibiais · Glúteo · Eretores",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [lombarWarn],
        description: "Joelhos levemente flexionados, coluna NEUTRA. Desça até sentir alongamento dos isquios. Halteres = mais controle que barra.",
      },
      {
        id: "2-4", name: "Mesa flexora",
        muscle: "Isquiotibiais — bíceps femoral",
        sets: 3, reps: "10–12", rest: "1,5 min", rir: "RIR 0–1",
        warnings: [],
        description: "Quadril no banco durante todo o movimento. Sem usar impulso.",
      },
      {
        id: "2-5", name: "Panturrilha em pé (pausa 2s alongamento)",
        muscle: "Gastrocnêmio · Sóleo",
        sets: 4, reps: "8–12", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — MYO-REP final",
        warnings: [],
        description: "Calcanhar abaixo do degrau (alongamento) + pausa de 2s. Suba até a ponta dos pés.",
      },
    ],
    core: [],
  },

  // ───────────── QUINTA — UPPER B ─────────────
  {
    dayIndex: 3,
    dayLabel: "Quinta-feira",
    shortLabel: "Qui",
    title: "Upper B",
    colorClass: "pink",
    tags: ["Re-estímulo", "Braços", "Ombro"],
    totalExercises: 8,
    totalSets: 25,
    estimatedTime: "~75",
    isRest: false,
    exercises: [
      {
        id: "3-0", name: "Supino reto barra ou máquina",
        muscle: "Peitoral médio · Tríceps",
        sets: 3, reps: "6–10", rest: "3 min", rir: "RIR 2",
        warnings: [shoulderWarn],
        description: "Variante reta para complementar o inclinado de Push A. Cotovelos a ~45° do tronco.",
      },
      {
        id: "3-1", name: "Puxada neutra ou pulldown",
        muscle: "Latíssimo · Bíceps",
        sets: 4, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [],
        description: "Pegada neutra é mais amigável para o ombro. Puxe até o peito superior.",
      },
      {
        id: "3-2", name: "Crossover baixo (peito superior)",
        muscle: "Peitoral superior",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — DROP SET: falha → tira 30% → falha",
        warnings: [shoulderWarn],
        description: "Polias baixas, mãos sobem em direção ao queixo. Estimula a porção clavicular do peito.",
      },
      {
        id: "3-3", name: "Remada baixa cabo",
        muscle: "Costas médias · Romboides",
        sets: 3, reps: "10–12", rest: "2 min", rir: "RIR 1",
        warnings: [lombarWarn],
        description: "Tronco ereto, puxe em direção ao umbigo. Omoplatas retraídas no fim.",
      },
      {
        id: "3-4", name: "Desenvolvimento Arnold ou halter",
        muscle: "Deltoide anterior + lateral",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: [shoulderWarn],
        description: "Arnold: parte com palmas para você e gira até pronar no topo. Se houver dor no ombro esq., faça unilateral com carga reduzida.",
      },
      {
        id: "3-5", name: "Elevação lateral pegada inversa (cabo)",
        muscle: "Deltoide lateral — fibras posteriores",
        sets: 3, reps: "12–20", rest: "1 min", rir: "RIR 0",
        technique: "Última série — MYO-REP final",
        warnings: [],
        description: "Polia baixa atrás, pegada supinada. Variação que ataca fibras menos solicitadas pelo lateral comum.",
      },
      {
        id: "3-6", name: "Tríceps francês overhead corda (pausa 1s)",
        muscle: "Tríceps — cabeça longa",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 0–1",
        warnings: [shoulderWarn],
        description: "Overhead alonga a cabeça longa do tríceps. Pausa 1s na posição alongada. Se ombro esq. doer, faça por trás da cabeça com cuidado.",
      },
      {
        id: "3-7", name: "Rosca martelo cabo corda",
        muscle: "Bíceps · Braquiorradial",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — REST-PAUSE",
        warnings: [],
        description: "Pegada neutra na corda. Cotovelos fixos. Excelente para braquial e antebraço.",
      },
    ],
    core: [],
  },

  // ───────────── SEXTA — LOWER B ─────────────
  {
    dayIndex: 4,
    dayLabel: "Sexta-feira",
    shortLabel: "Sex",
    title: "Lower B",
    colorClass: "orange",
    tags: ["Posterior", "Glúteo", "Adutor"],
    totalExercises: 8,
    totalSets: 25,
    estimatedTime: "~70",
    isRest: false,
    warning: {
      title: "⚠ Atenção — RDL e Lombar",
      text: "RDL: pausa 1s no alongamento, coluna SEMPRE neutra. Se a lombar fadigar, reduza a carga — técnica > peso.",
    },
    exercises: [
      {
        id: "4-0", name: "RDL com barra (pausa 1s alongamento)",
        muscle: "Isquiotibiais · Glúteo · Eretores",
        sets: 4, reps: "6–10", rest: "3 min", rir: "RIR 2",
        warnings: [lombarWarn],
        description: "Joelhos levemente flexionados. Empurre o quadril para trás. Pausa 1s no ponto mais baixo (alongamento dos isquios).",
      },
      {
        id: "4-1", name: "Hack squat ou agachamento búlgaro",
        muscle: "Quadríceps · Glúteo",
        sets: 3, reps: "8–12", rest: "3 min", rir: "RIR 1–2",
        warnings: [],
        description: "Hack: pés mais altos no apoio = mais glúteo/posterior. Búlgaro: pé traseiro elevado, tronco ereto.",
      },
      {
        id: "4-2", name: "Cadeira flexora unilateral",
        muscle: "Isquiotibiais — bíceps femoral",
        sets: 3, reps: "10–12", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — DROP SET",
        warnings: [],
        description: "Unilateral identifica e corrige assimetrias. Movimento controlado.",
      },
      {
        id: "4-3", name: "Elevação pélvica (hip thrust)",
        muscle: "Glúteo máximo · Isquios proximais",
        sets: 3, reps: "8–12", rest: "2,5 min", rir: "RIR 1–2",
        warnings: ["⚠ pelve neutra no topo"],
        description: "Carga sobre o quadril com proteção. Pelve neutra no topo — não hiperextenda a lombar. Empurre pelos calcanhares.",
      },
      {
        id: "4-4", name: "Adutora máquina (pausa 1s alongamento)",
        muscle: "Adutores",
        sets: 3, reps: "12–15", rest: "1,5 min", rir: "RIR 0–1",
        warnings: [],
        description: "Pausa 1s na posição alongada. Adutor é parte importante da massa da coxa — não pule.",
      },
      {
        id: "4-5", name: "Panturrilha sentado",
        muscle: "Sóleo",
        sets: 3, reps: "10–15", rest: "1,5 min", rir: "RIR 0",
        technique: "Última série — MYO-REP final",
        warnings: [],
        description: "Sentado = sóleo prioritário. Amplitude completa, pausa breve no topo.",
      },
      {
        id: "4-6", name: "Abdominal cabo (crunch ajoelhado)",
        muscle: "Reto abdominal",
        sets: 3, reps: "12–15", rest: "1,5 min", rir: "RIR 0–1",
        warnings: [],
        description: "Ajoelhado, corda atrás da cabeça. Foco em flexionar a coluna (não puxar com o quadril).",
      },
      {
        id: "4-7", name: "Prancha frontal (extra)",
        muscle: "Core · Lombar (estabilização)",
        sets: 3, reps: "30–45s", rest: "45s", rir: "—",
        warnings: [],
        description: "Estabilização para fechar a semana. Quadril alinhado, core ativado.",
      },
    ],
    core: [],
  },

  // ───────────── SÁBADO — OFF ─────────────
  {
    dayIndex: 5,
    dayLabel: "Sábado",
    shortLabel: "Sáb",
    title: "OFF — Recuperação",
    colorClass: "yellow",
    tags: ["Recuperação", "Cardio leve opcional"],
    totalExercises: 0,
    totalSets: 0,
    estimatedTime: "30–40",
    isRest: true,
    exercises: [],
    core: [],
    restInfo: [
      {
        title: "Cardio leve opcional",
        items: [
          "Caminhada inclinada 30–40 min (Zona 2)",
          "Bike em ritmo conversável",
          "Mobilidade: quadril, ombros, tornozelos (10–15 min)",
        ],
      },
      {
        title: "Recuperação ativa",
        items: [
          "Hidrate bem (2,5–3L)",
          "Proteína: 2,0–2,4 g/kg distribuída em 4–5 refeições",
          "Cardio de Zona 2 não atrapalha hipertrofia — sustenta o NEAT em cutting",
        ],
      },
    ],
  },

  // ───────────── DOMINGO — OFF ─────────────
  {
    dayIndex: 6,
    dayLabel: "Domingo",
    shortLabel: "Dom",
    title: "OFF — Descanso total",
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
          "Hipertrofia acontece no descanso. Sono 7–9h é o suplemento mais importante.",
        ],
      },
      {
        title: "Checklist de domingo",
        items: [
          "Durma 7–9h",
          "Beba 2,5–3L de água",
          "Planeje refeições da semana",
          "Caminhada leve de 20 min se quiser",
        ],
      },
    ],
  },
];

export const progressionSteps = [
  { num: 1, title: "Dupla Progressão — como funciona", text: "Trabalhe na faixa de reps prescrita (ex: 8–12) com o RIR alvo. Quando bater o TOPO da faixa em TODAS as séries com o RIR alvo, suba a carga em 2–5%. Volte para o piso da faixa com a nova carga." },
  { num: 2, title: "Quanto subir", text: "Isolados pequenos (lateral, panturrilha, rosca): +1–2,5 kg. Compostos grandes (supino, agacha, RDL): +2,5–5 kg." },
  { num: 3, title: "RIR — Reps In Reserve", text: "RIR 0 = falha real. RIR 2 = poderia fazer mais 2 reps. Compostos pesados RIR 1–3, isolados RIR 0–1. Acima de RIR 4 = leve demais, sem estímulo." },
  { num: 4, title: "Travou 2 semanas?", text: "Confira sono, alimentação, ou troque o exercício. Estagnação não é sinal para forçar mais — é sinal para investigar a recuperação." },
  { num: 5, title: "Deload", text: "A cada 5–8 semanas, faça uma SEMANA DE DELOAD: corte 40–50% das séries, mantenha as cargas. Permite recuperação estrutural sem perder força." },
  { num: 6, title: "Técnicas avançadas (última série)", text: "Drop set, rest-pause, myo-rep e pausa no alongamento finalizam o estímulo. Use só na ÚLTIMA série dos exercícios marcados. Mais não é melhor." },
];

export const profileData = {
  age: 20,
  weight: "97kg",
  height: "1,68m",
  bmi: "34,4",
  goal: "Hipertrofia + Cutting",
  warnings: [
    { title: "⚠ Ombro esquerdo (histórico de trauma)", text: "Evite: overhead press livre, upright row, bench dips. Inclua face pull/rotação externa em TODOS os dias de upper. Progrida amplitude lentamente." },
    { title: "⚠ Lombar sensível", text: "Core ativado em todos os exercícios. Coluna neutra em RDL/stiff e remadas. Prefira hack squat ao agachamento livre se houver desconforto." },
  ],
};

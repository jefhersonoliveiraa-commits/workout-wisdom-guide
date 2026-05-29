cat << 'EOF' > src/lib/exerciseApi.ts
export interface ExerciseSuggestion {
  id: string;
  name: string;
  category: string | null;
  image: string | null;
}

const MUSCLES_PT: Record<string, string> = {
  'abductors': 'Abdutores', 'abs': 'Abdômen', 'adductors': 'Adutores',
  'biceps': 'Bíceps', 'calves': 'Panturrilhas', 'cardiovascular system': 'Cardio',
  'delts': 'Ombros', 'forearms': 'Antebraços', 'glutes': 'Glúteos',
  'hamstrings': 'Posterior de Coxa', 'lats': 'Dorsais', 'levator scapulae': 'Pescoço',
  'pectorals': 'Peitoral', 'quads': 'Quadríceps', 'serratus anterior': 'Serrátil',
  'spine': 'Lombar', 'traps': 'Trapézio', 'triceps': 'Tríceps',
  'upper back': 'Costas', 'back': 'Costas', 'chest': 'Peito'
};

async function translateText(text: string, from: 'pt' | 'en', to: 'pt' | 'en'): Promise<string> {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    return text;
  }
}

export async function searchExercises(term: string): Promise<ExerciseSuggestion[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!apiKey || apiKey === '0623dde6b1msh3ca327ac3342d18p10504ajsn21bd8aecaa68') {
    return [{ id: `custom_${Date.now()}`, name: term, category: 'Personalizado (Sem API Key)', image: null }];
  }

  const cacheKey = `exdb:${q.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as ExerciseSuggestion[]; } catch {}
  }

  let results: ExerciseSuggestion[] = [];

  try {
    // A. Tradução PT -> EN
    let searchEn = await translateText(q, 'pt', 'en');
    const sl = searchEn.toLowerCase();
    
    // Ajustes para as palavras que o tradutor erra com mais frequência
    if (sl.includes('supine')) searchEn = 'bench press';
    if (sl.includes('squat') || sl.includes('agachamento')) searchEn = 'squat';
    if (sl.includes('deadlift')) searchEn = 'deadlift';
    if (sl.includes('pulley') || sl.includes('pulldown')) searchEn = 'pulldown';
    if (sl.includes('leg press')) searchEn = 'leg press';

    // B. Busca Exercise DB (Sem o limit na URL para evitar o erro de 6 bytes)
    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchEn)}`, 
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      }
    );

    if (res.ok) {
      // Pega como texto puro para evitar o crash caso o Json retorne vazio/quebrado
      const textData = await res.text();
      let exercises = [];
      try {
        exercises = JSON.parse(textData);
      } catch (e) {
        console.error("A API retornou um formato inesperado:", textData);
      }

      if (Array.isArray(exercises) && exercises.length > 0) {
        // Aplica o limite por código JavaScript
        const limitedExercises = exercises.slice(0, 15);
        
        results = await Promise.all(limitedExercises.map(async (ex: any) => {
          const translatedName = await translateText(ex.name, 'en', 'pt');
          const targetMuscle = MUSCLES_PT[ex.target] || ex.target;
          return {
            id: ex.id,
            name: translatedName.charAt(0).toUpperCase() + translatedName.slice(1),
            category: targetMuscle,
            image: ex.gifUrl || null
          };
        }));
      }
    }
  } catch (error) {
    console.error("Erro na busca de exercícios:", error);
  }

  // C. O SEGREDO DO SUCESSO: Se a lista estiver vazia, injeta a opção personalizada!
  const exactMatch = results.some(r => r.name.toLowerCase() === q.toLowerCase());
  if (!exactMatch) {
    results.push({
      id: `custom_${Date.now()}`,
      name: term, 
      category: 'Exercício Personalizado',
      image: null
    });
  }

  sessionStorage.setItem(cacheKey, JSON.stringify(results));
  return results;
}

export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `como fazer ${name} execução correta`
  )}`;
}
EOF

echo "✅ Integração robusa com ExerciseDB aplicada!"
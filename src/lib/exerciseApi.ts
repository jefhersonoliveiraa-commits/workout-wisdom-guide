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
  'spine': 'Lombar', 'traps': 'Trapézio', 'triceps': 'Tríceps'
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
    console.error('Erro ao traduzir:', error);
    return text;
  }
}

export async function searchExercises(term: string): Promise<ExerciseSuggestion[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  if (!apiKey || apiKey === '0623dde6b1msh3ca327ac3342d18p10504ajsn21bd8aecaa68') {
    console.error("Erro: VITE_RAPIDAPI_KEY não configurada no arquivo .env");
    return [];
  }

  const cacheKey = `exdb:${q.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as ExerciseSuggestion[]; } catch {}
  }

  try {
    let searchEn = await translateText(q, 'pt', 'en');
    if (searchEn.toLowerCase().includes('supine')) searchEn = 'bench press';

    const res = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchEn)}?limit=10`, 
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      }
    );

    if (!res.ok) return [];
    const exercises = await res.json();

    const results: ExerciseSuggestion[] = await Promise.all(exercises.map(async (ex: any) => {
      const translatedName = await translateText(ex.name, 'en', 'pt');
      const targetMuscle = MUSCLES_PT[ex.target] || ex.target;

      return {
        id: ex.id,
        name: translatedName.charAt(0).toUpperCase() + translatedName.slice(1),
        category: targetMuscle,
        image: ex.gifUrl
      };
    }));

    sessionStorage.setItem(cacheKey, JSON.stringify(results));
    return results;

  } catch (error) {
    console.error("Erro geral na busca de exercícios:", error);
    return [];
  }
}

export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `como fazer ${name} execução correta`
  )}`;
}

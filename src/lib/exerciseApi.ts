

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
  } catch {
    return text;
  }
}

export async function searchExercises(term: string): Promise<ExerciseSuggestion[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const cacheKey = `exdb:${q.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as ExerciseSuggestion[]; } catch {}
  }

  let results: ExerciseSuggestion[] = [];

  try {
    let searchEn = await translateText(q, 'pt', 'en');
    const sl = searchEn.toLowerCase();

    if (sl.includes('supine')) searchEn = 'bench press';
    if (sl.includes('squat') || sl.includes('agachamento')) searchEn = 'squat';
    if (sl.includes('deadlift')) searchEn = 'deadlift';
    if (sl.includes('pulley') || sl.includes('pulldown')) searchEn = 'pulldown';
    if (sl.includes('leg press')) searchEn = 'leg press';

    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = session ? await fetch(
      `https://${projectId}.supabase.co/functions/v1/search-exercises?q=${encodeURIComponent(searchEn)}`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
      }
    ) : null;

    if (res && res.ok) {
      const payload = await res.json();
      const exercises = Array.isArray(payload?.exercises) ? payload.exercises : [];

      if (exercises.length > 0) {
        results = await Promise.all(exercises.map(async (ex: any) => {
          const translatedName = await translateText(ex.name, 'en', 'pt');
          const targetMuscle = MUSCLES_PT[ex.target] || ex.target;
          return {
            id: ex.id,
            name: translatedName.charAt(0).toUpperCase() + translatedName.slice(1),
            category: targetMuscle,
            image: ex.gifUrl || null,
          };
        }));
      }
    }
  } catch {
    // Falha silenciosa — usuário ainda pode adicionar exercício personalizado.
  }

  const exactMatch = results.some(r => r.name.toLowerCase() === q.toLowerCase());
  if (!exactMatch) {
    results.push({
      id: `custom_${Date.now()}`,
      name: term,
      category: 'Exercício Personalizado',
      image: null,
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

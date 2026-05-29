// Integração com a API pública do Wger (sem chave) para listagem de exercícios
// + helper de busca de vídeo demonstrativo no YouTube (sem chave).
// A base do Wger tem melhor cobertura em inglês, então buscamos em inglês (language=2).

export interface ExerciseSuggestion {
  id: number;
  name: string;
  category: string | null;
  image: string | null;
}

const BASE = 'https://wger.de/api/v2';

function absImage(img: string | null): string | null {
  if (!img) return null;
  return img.startsWith('/') ? `https://wger.de${img}` : img;
}

export async function searchExercises(term: string): Promise<ExerciseSuggestion[]> {
  const q = term.trim();
  if (q.length < 2) return [];

  const cacheKey = `wger:${q.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as ExerciseSuggestion[];
    } catch {
      /* ignora cache inválido */
    }
  }

  try {
    // NOVA URL: Utilizando exerciseinfo no lugar do antigo exercise/search
    const res = await fetch(
      `${BASE}/exerciseinfo/?language=2&search=${encodeURIComponent(q)}&limit=15`
    );
    
    if (!res.ok) return [];
    const json = await res.json();
    
    // O novo endpoint retorna um array de objetos dentro de 'results'
    const rawResults = json.results || json.suggestions || [];
    
    const results: ExerciseSuggestion[] = rawResults
      .map((s: any) => {
        // Formato antigo (fallback de segurança)
        if (s.data) {
          return {
            id: s.data.base_id ?? s.data.id ?? 0,
            name: s.value ?? s.data.name ?? '',
            category: s.data.category ?? null,
            image: absImage(s.data.image_thumbnail ?? s.data.image ?? null),
          };
        }
        
        // Novo Formato (exerciseinfo)
        return {
          id: s.id,
          name: s.name,
          category: s.category?.name ?? null,
          image: absImage(s.images?.[0]?.image ?? null), // Pega a primeira imagem, se houver
        };
      })
      .filter((r: ExerciseSuggestion) => r.name);

    sessionStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch (error) {
    console.error("Erro ao buscar exercícios:", error);
    return [];
  }
}

// Link de busca no YouTube — abre os melhores vídeos "como fazer X" em português.
export function youtubeSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `como fazer ${name} exercício`
  )}`;
}

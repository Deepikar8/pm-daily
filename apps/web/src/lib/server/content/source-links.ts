type SourceLike = {
  source_url?: string;
  search_url?: string;
};

const URL_REWRITES = new Map([
  [
    "https://www.lennysnewsletter.com/p/building-eval-systems-that-improve-your-ai-product",
    "https://www.lennysnewsletter.com/p/building-eval-systems-that-improve",
  ],
]);

function normalizeUrl(url: string | undefined) {
  if (!url) return url;
  return URL_REWRITES.get(url) ?? url;
}

export function normalizeSourceLinks<T extends SourceLike | null | undefined>(source: T): T {
  if (!source) return source;
  return {
    ...source,
    source_url: normalizeUrl(source.source_url),
    search_url: normalizeUrl(source.search_url),
  };
}

export function normalizeContentSourceLinks<T extends { source?: SourceLike; questions?: any[] }>(
  content: T,
): T {
  return {
    ...content,
    source: normalizeSourceLinks(content.source),
    questions: content.questions?.map((q) => ({
      ...q,
      citation: normalizeSourceLinks(q.citation),
    })),
  };
}

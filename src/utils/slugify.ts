/**
 * Generate a URL-friendly slug from a name.
 * e.g. "Manchester United" → "manchester-united"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Build a hybrid SEO-friendly path: "33-manchester-united"
 */
export function buildEntitySlug(id: string | number, name: string): string {
  return `${id}-${slugify(name)}`;
}

/**
 * Extract numeric ID from a hybrid slug like "33-manchester-united",
 * a plain numeric ID like "33", or fallback to the raw string for name search.
 */
export function extractIdFromSlug(slug: string): string {
  const match = slug.match(/^(\d+)(-|$)/);
  return match ? match[1] : slug;
}

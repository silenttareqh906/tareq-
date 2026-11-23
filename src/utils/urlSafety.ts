const SAFE_RASTER_DATA_IMAGE_RE =
  /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

export function sanitizeExternalUrl(
  raw: string | undefined | null,
  fallback = 'https://facebook.com'
): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function sanitizeImageUrl(
  raw: string | undefined | null,
  fallback = '/assets/aistudio/hero.jpg'
): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  if (SAFE_RASTER_DATA_IMAGE_RE.test(trimmed)) {
    return trimmed;
  }

  if (
    (trimmed.startsWith('/assets/') ||
      trimmed.startsWith('/src/assets/') ||
      trimmed.startsWith('/images/')) &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

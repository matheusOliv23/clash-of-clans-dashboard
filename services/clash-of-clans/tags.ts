export class ClashRequestError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ClashRequestError";
  }
}

/**
 * Tags de clã e de jogador usam o mesmo alfabeto do jogo,
 * sem letras ambíguas. O # inicial é opcional na entrada.
 */
const TAG_PATTERN = /^#[0289PYLQGRJCUV]{3,14}$/;

export function normalizeClashTag(tag: string): string {
  const trimmed = tag.trim().toUpperCase();
  if (!trimmed) {
    throw new ClashRequestError("A tag está vazia.");
  }

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!TAG_PATTERN.test(withHash)) {
    throw new ClashRequestError(
      "A tag precisa usar o formato do Clash of Clans, como #2CLG8LJ2J.",
    );
  }

  return withHash;
}

export function normalizeClanTag(tag: string): string {
  return normalizeClashTag(tag);
}

export function normalizePlayerTag(tag: string): string {
  return normalizeClashTag(tag);
}

export function encodeClashTag(tag: string): string {
  return encodeURIComponent(normalizeClashTag(tag));
}

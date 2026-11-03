import "server-only";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isEnvSet(name: string): boolean {
  return readEnv(name) !== undefined;
}

export function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`A variável de ambiente ${name} não está definida.`);
  }
  return value;
}

const DEFAULT_POLL_MS = 60_000;
const MIN_POLL_MS = 15_000;
const MAX_POLL_MS = 10 * 60_000;

export function getClashPollIntervalMs(): number {
  const raw = readEnv("CLASH_POLL_INTERVAL_MS");
  if (!raw) {
    return DEFAULT_POLL_MS;
  }

  const value = Number(raw);
  if (!Number.isInteger(value)) {
    return DEFAULT_POLL_MS;
  }

  return Math.min(MAX_POLL_MS, Math.max(MIN_POLL_MS, value));
}

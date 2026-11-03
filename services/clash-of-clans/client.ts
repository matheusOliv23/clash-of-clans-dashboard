import "server-only";

import { requireEnv } from "@/lib/env";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import type { ClashApiErrorBody } from "@/types/clash-of-clans";

export const CLASH_API_BASE_URL = "https://api.clashofclans.com/v1";
export const CLASH_API_TIMEOUT_MS = 10_000;

export async function clashFetch<T>(path: string): Promise<T> {
  const token = requireEnv("CLASH_API_KEY");
  const url = new URL(path.replace(/^\//, ""), `${CLASH_API_BASE_URL}/`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(CLASH_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw await toClashApiError(response);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ClashApiError) {
      throw error;
    }

    if (isTimeout(error)) {
      throw new ClashApiError(
        "timeout",
        0,
        `A API do Clash of Clans não respondeu em ${CLASH_API_TIMEOUT_MS} ms.`,
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Falha inesperada ao consultar a API do Clash of Clans.";

    throw new ClashApiError("unexpected", 0, message);
  }
}

async function toClashApiError(response: Response): Promise<ClashApiError> {
  const body = await readErrorBody(response);
  const reason = body?.reason;
  const message =
    body?.message ??
    `A API do Clash of Clans respondeu com status ${response.status}.`;
  const retryAfter = response.headers.get("retry-after") ?? undefined;

  if (response.status === 401) {
    return new ClashApiError("unauthorized", 401, message, reason, retryAfter);
  }

  if (response.status === 403) {
    return new ClashApiError("forbidden", 403, message, reason, retryAfter);
  }

  if (response.status === 404) {
    return new ClashApiError("notFound", 404, message, reason, retryAfter);
  }

  if (response.status === 429) {
    return new ClashApiError("rateLimited", 429, message, reason, retryAfter);
  }

  return new ClashApiError(
    "unexpected",
    response.status,
    message,
    reason,
    retryAfter,
  );
}

async function readErrorBody(
  response: Response,
): Promise<ClashApiErrorBody | undefined> {
  try {
    return (await response.json()) as ClashApiErrorBody;
  } catch {
    return undefined;
  }
}

function isTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "TimeoutError" || error.name === "AbortError";
}

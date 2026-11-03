import { connection } from "next/server";

import { requireEnv } from "@/lib/env";
import {
  ClashApiError,
  ClashRequestError,
  normalizeClanTag,
} from "@/services/clash-of-clans";
import type { ClashListQuery } from "@/types/clash-of-clans";

export async function clashJson(
  load: () => Promise<unknown>,
): Promise<Response> {
  await connection();

  try {
    return Response.json(await load());
  } catch (error) {
    return clashErrorResponse(error);
  }
}

export function configuredClanTag(): string {
  return normalizeClanTag(requireEnv("CLAN_TAG"));
}

export function listQueryFrom(request: Request): ClashListQuery {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const after = url.searchParams.get("after") ?? undefined;
  const before = url.searchParams.get("before") ?? undefined;

  return {
    ...(limit === null ? {} : { limit: Number(limit) }),
    ...(after ? { after } : {}),
    ...(before ? { before } : {}),
  };
}

export function clashErrorResponse(error: unknown): Response {
  if (error instanceof ClashRequestError) {
    return Response.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof ClashApiError) {
    const status =
      error.status === 0
        ? error.kind === "timeout"
          ? 504
          : 502
        : error.status;
    return Response.json(
      {
        message: error.message,
        kind: error.kind,
        ...(error.reason ? { reason: error.reason } : {}),
        ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
      },
      { status },
    );
  }

  if (error instanceof Error && error.message.includes("não está definida")) {
    return Response.json({ message: error.message }, { status: 503 });
  }

  return Response.json(
    { message: "Falha inesperada ao consultar a API do Clash of Clans." },
    { status: 500 },
  );
}

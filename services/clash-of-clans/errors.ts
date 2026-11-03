export type ClashApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "rateLimited"
  | "timeout"
  | "unexpected";

export class ClashApiError extends Error {
  readonly kind: ClashApiErrorKind;
  readonly status: number;
  readonly reason: string | undefined;
  readonly retryAfter: string | undefined;

  constructor(
    kind: ClashApiErrorKind,
    status: number,
    message: string,
    reason?: string,
    retryAfter?: string,
  ) {
    super(message);
    this.name = "ClashApiError";
    this.kind = kind;
    this.status = status;
    this.reason = reason;
    this.retryAfter = retryAfter;
  }
}

export { ClashRequestError } from "@/services/clash-of-clans/tags";

import type { UnknownRecord } from './types';

/** Shape of structured error payloads parsed out of non-2xx responses. */
export interface ApiErrorDetails {
  /** Field-level validation errors: `{ email: 'Required', ... }`. */
  errors: Record<string, string>;
  /** Any other string/array fields that were on the payload root, flattened to strings. */
  [extra: string]: string | Record<string, string>;
}

/**
 * Thrown by the client on non-2xx responses and network failures.
 *
 * Extends the standard `Error` so it plays nicely with stack traces and
 * `instanceof` checks. The parsed server payload (if any) is available
 * on `.payload`, while flattened field errors are normalised into
 * `.details.errors`.
 */
export class ApiError extends Error {
  /** HTTP status. `0` for network/abort errors. */
  readonly status: number;
  /** Normalised error bag — always present, never null. */
  readonly details: ApiErrorDetails;
  /** The raw parsed payload from the server (undefined if none/invalid). */
  readonly payload: unknown;
  /** The response object, if one was received. */
  readonly response?: Response;

  constructor(params: {
    message: string;
    status: number;
    details?: ApiErrorDetails;
    payload?: unknown;
    response?: Response;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.details = params.details ?? { errors: {} };
    this.payload = params.payload;
    this.response = params.response;
  }
}

const isRecord = (v: unknown): v is UnknownRecord =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toStringValue = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v);
};

/**
 * Convert an arbitrary server payload into a normalised `ApiErrorDetails`
 * structure, extracting a human-readable message.
 */
export function normalizeErrorPayload(
  input: unknown,
  fallbackMessage: string
): { message: string; details: ApiErrorDetails } {
  const details: ApiErrorDetails = { errors: {} };

  if (!isRecord(input)) return { message: fallbackMessage, details };

  const obj = input;

  const message =
    (typeof obj.message === 'string' && obj.message) ||
    (typeof obj.error === 'string' && obj.error) ||
    (Array.isArray(obj.errors) && obj.errors.map(String).join(', ')) ||
    fallbackMessage;

  const pushErrors = (maybe: unknown): void => {
    if (!isRecord(maybe)) return;
    for (const [k, v] of Object.entries(maybe)) {
      if (typeof v === 'string') {
        details.errors[k] = v;
        continue;
      }
      if (Array.isArray(v)) {
        details.errors[k] = v.map(String).join(', ');
        continue;
      }
      if (isRecord(v)) {
        pushErrors(v);
        continue;
      }
      const s = toStringValue(v);
      if (s !== undefined) details.errors[k] = s;
    }
  };

  if (obj.errors) pushErrors(obj.errors);
  if (obj.detail) pushErrors(obj.detail);
  if (obj.details) pushErrors(obj.details);
  if (isRecord(obj.data) && obj.data.errors) pushErrors(obj.data.errors);

  for (const [k, v] of Object.entries(obj)) {
    if (k === 'errors' || k === 'message') continue;
    if (typeof v === 'string') {
      (details as Record<string, unknown>)[k] = v;
    } else if (Array.isArray(v)) {
      (details as Record<string, unknown>)[k] = v.map(String).join(', ');
    }
  }

  return { message, details };
}

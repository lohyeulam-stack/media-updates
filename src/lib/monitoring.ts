type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogValue[]
  | { [key: string]: LogValue };

export type LogContext = Record<string, LogValue>;

const REDACTED_KEY_PATTERNS = [
  /(^|[_-])(authorization|cookie|password|secret|token|session)([_-]|$)/i,
  /(^|[_-])(api[_-]?key|apikey)([_-]|$)/i,
  /(^|[_-])(access|refresh)([_-]|$)/i,
] as const;

function isSensitiveKey(key: string): boolean {
  return REDACTED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function redactValue(key: string, value: LogValue): LogValue {
  if (isSensitiveKey(key)) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        nestedKey,
        redactValue(nestedKey, nestedValue),
      ]),
    );
  }

  return value;
}

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, redactValue(key, value)]),
  );
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return {
      name: "UnknownError",
      message: error,
      stack: undefined,
    };
  }

  return {
    name: "UnknownError",
    message: "Non-Error value thrown",
    stack: undefined,
  };
}

export function logError(error: unknown, context?: LogContext): void {
  console.error("[App Error]", {
    error: normalizeError(error),
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
  });
}

export function logWarning(message: string, context?: LogContext): void {
  console.warn("[App Warning]", {
    message,
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
  });
}

export function logInfo(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[App Info]", {
      message,
      context: sanitizeContext(context),
      timestamp: new Date().toISOString(),
    });
  }
}

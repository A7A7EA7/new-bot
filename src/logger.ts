type LogContext = Record<string, unknown> | undefined;

function fmt(level: string, ctxOrMsg: LogContext | string, maybeMsg?: string): string {
  let ctx: LogContext;
  let msg: string;
  if (typeof ctxOrMsg === "string") {
    ctx = undefined;
    msg = ctxOrMsg;
  } else {
    ctx = ctxOrMsg;
    msg = maybeMsg ?? "";
  }
  const ts = new Date().toISOString();
  let out = `[${ts}] ${level.toUpperCase()} ${msg}`;
  if (ctx && Object.keys(ctx).length > 0) {
    try {
      out += " " + JSON.stringify(ctx, replaceErrors);
    } catch {
      out += " [unserializable context]";
    }
  }
  return out;
}

function replaceErrors(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

export const logger = {
  info: (ctxOrMsg: LogContext | string, msg?: string) =>
    console.log(fmt("info", ctxOrMsg, msg)),
  warn: (ctxOrMsg: LogContext | string, msg?: string) =>
    console.warn(fmt("warn", ctxOrMsg, msg)),
  error: (ctxOrMsg: LogContext | string, msg?: string) =>
    console.error(fmt("error", ctxOrMsg, msg)),
  debug: (ctxOrMsg: LogContext | string, msg?: string) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(fmt("debug", ctxOrMsg, msg));
    }
  },
};

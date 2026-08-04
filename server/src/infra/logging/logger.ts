export type LogContext = {
  action?: string;
  requestId?: string;
  signal?: string;
  userId?: string;
};

export const Logger = {
  debug(message: string, context: LogContext = {}) {
    write("debug", message, context);
  },
  info(message: string, context: LogContext = {}) {
    write("info", message, context);
  },
  error(message: string, context: LogContext = {}) {
    write("error", message, context);
  },
};

function write(level: "debug" | "info" | "error", message: string, context: LogContext) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  console.log(entry);
}

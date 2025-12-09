import fs from "fs";
import path from "path";

type LOG_LEVEL = "debug" | "info" | "warn" | "error";
type LOG_MESSAGE = string | number | boolean | Record<string, unknown> | Error;
type LOG_META = Record<string, unknown> | undefined;

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);

function formatMessage(level: LOG_LEVEL, message: LOG_MESSAGE, meta?: LOG_META): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | meta: ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

export const logger = {
  debug: (message: LOG_MESSAGE, meta?: LOG_META) => {
    const log = formatMessage("debug", message, meta);
    if (process.env.DEBUG_OPTION === "TRUE") console.debug(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  info: (message: LOG_MESSAGE, meta?: LOG_META) => {
    const log = formatMessage("info", message, meta);
    console.log(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  warn: (message: LOG_MESSAGE, meta?: LOG_META) => {
    const log = formatMessage("warn", message, meta);
    console.warn(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  error: (message: LOG_MESSAGE, meta?: LOG_META) => {
    const log = formatMessage("error", message, meta);
    console.error(log);
    fs.appendFileSync(logFile, log + "\n");
  },
};

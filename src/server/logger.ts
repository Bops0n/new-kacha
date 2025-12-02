const fs = require('fs')
import path from "path";

type LOG_LEVEL = "debug" | "info" | "warn" | "error";

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);

function formatMessage(level: LOG_LEVEL, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | meta: ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

export const logger = {
  debug: (message: any, meta?: any) => {
    const log = formatMessage("debug", message, meta);
    if (process.env.DEBUG_OPTION === "TRUE") console.debug(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  info: (message: any, meta?: any) => {
    const log = formatMessage("info", message, meta);
    console.log(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  warn: (message: any, meta?: any) => {
    const log = formatMessage("warn", message, meta);
    console.warn(log);
    fs.appendFileSync(logFile, log + "\n");
  },
  error: (message: any, meta?: any) => {
    const log = formatMessage("error", message, meta);
    console.error(log);
    fs.appendFileSync(logFile, log + "\n");
  },
};

import pino from "pino";
import fs from "fs";
import path from "path";
import * as rfs from "rotating-file-stream";

const logDir = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const stream = rfs.createStream("app.log", {
  path: logDir,
  size: "1KB",
  compress: false,
  maxFiles: 5,
});

const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  stream
);

const formatLogValue = (value) => {
  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const buildMessage = (args) => args.map(formatLogValue).join(" ");

const appConsole = {
  log: (...args) => logger.info(buildMessage(args)),
  info: (...args) => logger.info(buildMessage(args)),
  warn: (...args) => logger.warn(buildMessage(args)),
  error: (...args) => logger.error(buildMessage(args)),
  debug: (...args) => logger.debug(buildMessage(args)),
};

export { appConsole };
export default logger;

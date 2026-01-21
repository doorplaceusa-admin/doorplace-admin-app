import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

export function logToFile(message: string) {
  const logFile = path.join(
    LOG_DIR,
    `shopify-restore-${new Date().toISOString().slice(0, 10)}.log`
  );

  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

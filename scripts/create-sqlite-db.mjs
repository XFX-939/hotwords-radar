import { existsSync, mkdirSync, openSync, closeSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const envText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const match = envText.match(/^DATABASE_URL=(.+)$/m);
const value = (process.env.DATABASE_URL ?? match?.[1] ?? "file:./dev.db").trim().replace(/^"|"$/g, "");

if (!value.startsWith("file:")) {
  process.exit(0);
}

const rawPath = decodeURIComponent(value.slice("file:".length));
const dbPath = isAbsolute(rawPath) ? rawPath : join(process.cwd(), "prisma", rawPath);

mkdirSync(dirname(dbPath), { recursive: true });
if (!existsSync(dbPath)) {
  closeSync(openSync(dbPath, "a"));
  console.log(`Created SQLite database file at ${dbPath}`);
}

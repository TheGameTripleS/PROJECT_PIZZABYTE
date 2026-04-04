import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "../../Database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routinePath = path.resolve(__dirname, "../../Database/income_metrics.sql");

export const ensureIncomeMetricsRoutine = async () => {
  const routineSql = await readFile(routinePath, "utf8");
  const statements = routineSql
    .split(/;\s*\r?\n(?=CREATE OR REPLACE FUNCTION)/g)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => (statement.endsWith(";") ? statement : `${statement};`));

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log("Income metrics functions ensured");
};

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const PAYROLL_DATABASE_URL =
  process.env["PAYROLL_DATABASE_URL"] ??
  "postgresql://postgres:admin123@localhost:5432/sunrise_payroll_attendance";

export const payrollPool = new Pool({
  connectionString: PAYROLL_DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const payrollDb = drizzle(payrollPool, { schema });

export * from "./schema.js";
export default payrollDb;

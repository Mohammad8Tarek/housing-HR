import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { payrollPool } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCompleteHrmsMigration() {
  console.log("🚀 Running Complete HRMS Enterprise Suite Migration on sunrise_payroll_attendance...");
  const sqlFile = path.resolve(__dirname, "migrations", "20261018_complete_hrms_suite.sql");
  const sqlContent = fs.readFileSync(sqlFile, "utf-8");

  const client = await payrollPool.connect();
  try {
    await client.query("BEGIN;");
    await client.query(sqlContent);
    await client.query("COMMIT;");
    console.log("✅ Complete HRMS Enterprise Suite migration applied successfully!");

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log(`📊 Total tables in sunrise_payroll_attendance now: ${res.rows.length}`);

  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await payrollPool.end();
  }
}

runCompleteHrmsMigration().catch((e) => {
  console.error("Fatal error during migration:", e);
  process.exit(1);
});

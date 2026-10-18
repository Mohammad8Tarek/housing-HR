import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { payrollPool } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runExpansionMigration() {
  console.log("🚀 Executing Enterprise Expansion Migration on sunrise_payroll_attendance...");
  const sqlFile = path.resolve(__dirname, "migrations", "20261018_enterprise_payroll_attendance_expansion.sql");
  const sqlContent = fs.readFileSync(sqlFile, "utf-8");

  const client = await payrollPool.connect();
  try {
    await client.query("BEGIN;");
    await client.query(sqlContent);
    await client.query("COMMIT;");
    console.log("✅ Enterprise Expansion Migration applied successfully!");

    // Verify hr_users seeded
    const usersRes = await client.query("SELECT id, username, role, system_access FROM hr_users;");
    console.log(`✅ Loaded ${usersRes.rows.length} dedicated HR / Payroll / Attendance users:`);
    for (const u of usersRes.rows) {
      console.log(`   - [${u.username}] Role: ${u.role} | System: ${u.system_access}`);
    }

  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await payrollPool.end();
  }
}

runExpansionMigration().catch((e) => {
  console.error("Fatal error during migration:", e);
  process.exit(1);
});

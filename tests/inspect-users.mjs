import { pool } from "../lib/db/src/index.js";

async function main() {
  const users = await pool.query('SELECT id, username, roles, permissions, property_id, property_ids FROM public.users ORDER BY id');
  console.log('Current Users:');
  console.table(users.rows);

  const props = await pool.query('SELECT id, name, schema_name FROM public.properties ORDER BY id');
  console.log('Current Properties:');
  console.table(props.rows);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

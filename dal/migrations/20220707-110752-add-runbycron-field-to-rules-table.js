// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  return await sql`
    ALTER TABLE "public"."update-rule"
      ADD COLUMN "run_by_cron" BOOLEAN DEFAULT FALSE;
  `
}

export const down = async function(sql) {
  return await sql`
    ALTER TABLE "public"."update-rule"
      DROP COLUMN "run_by_cron";
  `
}

// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  await sql`
    CREATE TYPE "public"."squidex_auth_enum" as enum ('GREEN', 'YELLOW', 'RED');
  `
  return await sql`
    ALTER TABLE "public"."course"
      DROP COLUMN "template",
      ADD COLUMN "since_published" json NULL,
      ADD COLUMN "prefix" TEXT NULL,
      ADD COLUMN "squidex_auth_state" "public"."squidex_auth_enum" DEFAULT 'RED';
  `
}

export const down = async function(sql) {
  return await sql`
    ALTER TABLE "public"."course"
      DROP COLUMN "since_published",
      DROP COLUMN "prefix",
      DROP COLUMN "squidex_auth_state",
      ADD COLUMN "template" json NULL;
      DROP TYPE "public"."squidex_auth_enum";
  `
}

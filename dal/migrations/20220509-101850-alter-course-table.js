
// trx - pg-promise's transaction/task (ITask<{}>)
// please refer to https://vitaly-t.github.io/pg-promise/Task.html

export const up = async function (trx) {
  return await trx.none(
    `
    CREATE TYPE "public"."squidex_auth_enum" as enum ('GREEN', 'YELLOW', 'RED');
    ALTER TABLE "public"."course"
      DROP COLUMN "template",
      ADD COLUMN "since_published" json NULL,
      ADD COLUMN "prefix" TEXT NULL,
      ADD COLUMN "squidex_auth_state" "public"."squidex_auth_enum" DEFAULT 'RED';
    `
  )
}

export const down = async function (trx) {
  return await trx.none(
    `
    ALTER TABLE "public"."course"
      DROP COLUMN "since_published",
      DROP COLUMN "prefix",
      DROP COLUMN "squidex_auth_state",
      ADD COLUMN "template" json NULL;
      DROP TYPE "public"."squidex_auth_enum";
    `
  )
}

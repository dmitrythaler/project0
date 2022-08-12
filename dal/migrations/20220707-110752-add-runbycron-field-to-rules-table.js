
// trx - pg-promise's transaction/task (ITask<{}>)
// please refer to https://vitaly-t.github.io/pg-promise/Task.html

export const up = async function (trx) {
  return await trx.none(
    `
    ALTER TABLE "public"."update-rule"
      ADD COLUMN "run_by_cron" BOOLEAN DEFAULT FALSE;
    `
  )
}

export const down = async function (trx) {
  return await trx.none(
    `
    ALTER TABLE "public"."update-rule"
      DROP COLUMN "run_by_cron";
    `
  )
}

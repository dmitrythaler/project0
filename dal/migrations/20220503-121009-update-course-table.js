
// trx - pg-promise's transaction/task (ITask<{}>)
// please refer to https://vitaly-t.github.io/pg-promise/Task.html

export const up = async function(trx) {
  return await trx.none(
    `
    ALTER TABLE "public"."course"
      DROP COLUMN "data_file_name",
      DROP COLUMN "assets_file_name",
      ADD COLUMN "s3_folder" TEXT NULL;
    `
  )
}

export const down = async function(trx) {
  return await trx.none(
    `
    ALTER TABLE "public"."course"
      DROP COLUMN "s3_folder",
      ADD COLUMN "data_file_name" TEXT NULL,
      ADD COLUMN "assets_file_name" TEXT NULL;
    `
  )
}

// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  return await sql`
    ALTER TABLE "public"."course"
      DROP COLUMN "data_file_name",
      DROP COLUMN "assets_file_name",
      ADD COLUMN "s3_folder" TEXT NULL;
  `
}

export const down = async function(sql) {
  return await sql`
    ALTER TABLE "public"."course"
      DROP COLUMN "s3_folder",
      ADD COLUMN "data_file_name" TEXT NULL,
      ADD COLUMN "assets_file_name" TEXT NULL;
  `
}

// trx - pg-promise's transaction

export const up = async function(trx) {
  return await trx.none(
    `
    CREATE TABLE "public"."course" (
      "uuid" uuid PRIMARY KEY default gen_random_uuid(),
      "name" TEXT NOT NULL,
      "squidex_id" TEXT NOT NULL,
      "squidex_secret" TEXT NOT NULL,
      "template" json NULL,
      "version" integer NOT NULL,
      "published_at" TIMESTAMP WITH TIME ZONE NULL,
      "data_file_name" TEXT NULL,
      "assets_file_name" TEXT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NULL,
      CONSTRAINT uq_course_name UNIQUE(name)
    );`
  )
}

export const down = async function(trx) {
  return await trx.none(
    `
    DROP TABLE "public"."course";
    `
  )
}


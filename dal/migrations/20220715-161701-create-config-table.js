// trx - pg-promise's transaction

export const up = async function (trx) {
  return await trx.none(
    `
    CREATE TABLE "public"."config" (
      "data" json NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NULL
    );
    INSERT INTO "public"."config" (data) VALUES ('{}');`
  )
}

export const down = async function (trx) {
  return await trx.none(
    `
    DROP TABLE "public"."config";
    `
  )
}


// trx - pg-promise's transaction

export const up = async function(trx) {
  return await trx.none(
    `
    CREATE TYPE "public"."user_role" AS enum (
      'admin',
      'user',
      'publisher',
      'manager',
      'zombie'
    );

    CREATE TABLE "public"."user" (
      "uuid" uuid PRIMARY KEY default gen_random_uuid(),
      "email" TEXT,
      "last_name" TEXT NOT NULL,
      "first_name" TEXT NULL,
      "password" TEXT NOT NULL,
      "is_active" BOOLEAN,
      "role" "public"."user_role" NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NULL,
      "last_login" TIMESTAMP WITH TIME ZONE NULL,
      CONSTRAINT uq_user_email UNIQUE(email)
    );`
  )
}

export const down = async function(trx) {
  return await trx.none(
    `
    DROP TABLE "public"."user";
    DROP TYPE IF EXISTS "public"."user_role";
    `
  )
}


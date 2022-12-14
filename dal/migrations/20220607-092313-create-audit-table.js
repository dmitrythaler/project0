// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  await sql`
    CREATE TYPE "public"."action_type" AS enum (
      'create',
      'publish',
      'login',
      'update',
      'delete'
    );
  `
  await sql`
    CREATE TYPE "public"."subject_type" AS enum (
      'user',
      'course'
    );
  `
  return await sql`
    CREATE TABLE "public"."audit" (
      "uuid" uuid PRIMARY KEY default gen_random_uuid(),
      "taken_on" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "actor_id" uuid NOT NULL,
      "action_type" "public"."action_type" NOT NULL,
      "subject_type" "public"."subject_type" NOT NULL,
      "subject_id" uuid NOT NULL,
      "data" json NULL,
      CONSTRAINT fk_audit_user_uuid FOREIGN KEY(actor_id) REFERENCES "public"."user"(uuid) ON DELETE NO ACTION
    );
  `
}

export const down = async function(sql) {
  return await sql`
    DROP TABLE "public"."audit";
    DROP TYPE IF EXISTS "public"."subject_type";
    DROP TYPE IF EXISTS "public"."action_type";
  `
}

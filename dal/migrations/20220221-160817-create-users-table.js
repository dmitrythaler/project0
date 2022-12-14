// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {

  await sql`
    CREATE TYPE "public"."user_role" AS enum (
      'admin',
      'user',
      'publisher',
      'manager',
      'zombie'
    );
  `

  await sql`
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
    );
  `
  await sql`
    INSERT INTO "public"."user"
      (email, last_name, first_name, password, is_active, role)
    VALUES
      ('root@domain.lan', 'Admin', 'Joe', '$2b$12$AlDaZ48.zr0gFDagbMb77eF17P3v3yQ..CrAf6CTusqKamSE6vPGS', true, 'admin');
  `
}

export const down = async function(sql) {
  return await sql`
    DROP TABLE "public"."user";
    DROP TYPE IF EXISTS "public"."user_role";
  `
}

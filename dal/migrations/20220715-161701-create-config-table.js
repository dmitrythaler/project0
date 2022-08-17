// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  await sql`
    CREATE TABLE "public"."config" (
      "data" json NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NULL
    );
  `
  return await sql`
    INSERT INTO "public"."config" (data) VALUES ('{}');
  `
}

export const down = async function(sql) {
  return await sql`
    DROP TABLE "public"."config";
  `
}


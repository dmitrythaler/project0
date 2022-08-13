// sql - transaction from Postgres.js
// please refer to https://github.com/porsager/postgres

export const up = async function(sql) {
  return await sql`
    CREATE TABLE "public"."update-rule" (
      "uuid" uuid PRIMARY KEY default gen_random_uuid(),
      "name" TEXT NOT NULL,
      "course_id" uuid NOT NULL,
      "test_path" TEXT NOT NULL,
      "test_func" TEXT NOT NULL,
      "update_path" TEXT NULL,
      "update_func" TEXT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updated_at" TIMESTAMP WITH TIME ZONE NULL,
      CONSTRAINT fk_update_rules_course_uuid FOREIGN KEY(course_id) REFERENCES "public"."course"(uuid) ON DELETE CASCADE
    );
  `
}

export const down = async function(sql) {
  return await sql`
    DROP TABLE "public"."update-rule";
  `
}

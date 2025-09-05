CREATE TABLE "orange_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "orange_users" (
    "id" serial PRIMARY KEY NOT NULL,
    "google_id" text NOT NULL,
    "email" varchar NOT NULL,
    "name" text NOT NULL,
    "picture" text NOT NULL,
    CONSTRAINT "orange_users_google_id_unique" UNIQUE("google_id"),
    CONSTRAINT "orange_users_email_unique" UNIQUE("email")
);

CREATE TABLE "search_history" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" INTEGER REFERENCES orange_users(id) ON DELETE SET NULL,
    "ip_address" TEXT,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "orange_sessions" ADD CONSTRAINT "orange_sessions_user_id_orange_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."orange_users"("id") 
    ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "session_user_id_idx" ON "orange_sessions" USING btree ("user_id");
CREATE INDEX "google_id_idx" ON "orange_users" USING btree ("google_id");
CREATE INDEX "email_idx" ON "orange_users" USING btree ("email");
CREATE INDEX "idx_search_history_user_id" ON "search_history" USING btree ("user_id");
CREATE INDEX "idx_search_history_ip_address" ON "search_history" USING btree ("ip_address") WHERE "user_id" IS NULL;

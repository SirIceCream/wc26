CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"before_data" jsonb,
	"after_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_provider_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_match_id" text NOT NULL,
	"provider_payload" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"sync_type" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"payload" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stadiums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fifa_stadium_id" text,
	"name" text NOT NULL,
	"city" text,
	"country_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stadiums_fifa_stadium_id_unique" UNIQUE("fifa_stadium_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"code" text PRIMARY KEY NOT NULL,
	"fifa_team_id" text,
	"football_data_team_id" integer,
	"name" text NOT NULL,
	"short_name" text,
	"country_code" text,
	"confederation" text,
	"flag_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_fifa_team_id_unique" UNIQUE("fifa_team_id"),
	CONSTRAINT "teams_football_data_team_id_unique" UNIQUE("football_data_team_id")
);
--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "home_team_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "away_team_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "game_id" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "fifa_match_number" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "football_data_match_id" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "group_name" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "stadium_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_placeholder" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_placeholder" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "scheduled_kickoff_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "provider_status" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "live_minute" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "home_penalty_score" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "away_penalty_score" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "result_type" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "last_provider_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "app_role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_user_id_profiles_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_provider_mappings" ADD CONSTRAINT "match_provider_mappings_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_log_actor_user_id_idx" ON "admin_audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_entity_idx" ON "admin_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_provider_mappings_provider_match_unique" ON "match_provider_mappings" USING btree ("provider","provider_match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_provider_mappings_match_provider_unique" ON "match_provider_mappings" USING btree ("match_id","provider");--> statement-breakpoint
CREATE INDEX "provider_sync_log_provider_idx" ON "provider_sync_log" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "provider_sync_log_started_at_idx" ON "provider_sync_log" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "stadiums_fifa_stadium_id_idx" ON "stadiums" USING btree ("fifa_stadium_id");--> statement-breakpoint
CREATE INDEX "teams_fifa_team_id_idx" ON "teams" USING btree ("fifa_team_id");--> statement-breakpoint
CREATE INDEX "teams_football_data_team_id_idx" ON "teams" USING btree ("football_data_team_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_stadium_id_stadiums_id_fk" FOREIGN KEY ("stadium_id") REFERENCES "public"."stadiums"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_game_id_idx" ON "matches" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "matches_kickoff_at_idx" ON "matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_stadium_id_idx" ON "matches" USING btree ("stadium_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_game_id_unique" UNIQUE("game_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_fifa_match_number_unique" UNIQUE("fifa_match_number");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_football_data_match_id_unique" UNIQUE("football_data_match_id");
CREATE TABLE "special_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"prediction_row" integer DEFAULT 1 NOT NULL,
	"champion_team_code" text,
	"total_goals" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "special_predictions_prediction_row_check" CHECK ("special_predictions"."prediction_row" in (1, 2)),
	CONSTRAINT "special_predictions_total_goals_check" CHECK ("special_predictions"."total_goals" is null or "special_predictions"."total_goals" between 0 and 999)
);
--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_champion_team_code_teams_code_fk" FOREIGN KEY ("champion_team_code") REFERENCES "public"."teams"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_predictions" ADD CONSTRAINT "special_predictions_league_user_membership_fk" FOREIGN KEY ("league_id","user_id") REFERENCES "public"."league_members"("league_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "special_predictions_league_user_row_unique" ON "special_predictions" USING btree ("league_id","user_id","prediction_row");--> statement-breakpoint
CREATE INDEX "special_predictions_user_id_idx" ON "special_predictions" USING btree ("user_id");
DROP INDEX "predictions_league_user_match_unique";--> statement-breakpoint
ALTER TABLE "league_members" ADD COLUMN "uses_two_prediction_rows" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "prediction_row" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "league_members"
SET "uses_two_prediction_rows" = "profiles"."uses_two_prediction_rows"
FROM "profiles"
WHERE "league_members"."user_id" = "profiles"."id"
	AND "profiles"."uses_two_prediction_rows" = true;--> statement-breakpoint
INSERT INTO "league_members" ("league_id", "user_id", "role")
SELECT DISTINCT "predictions"."league_id", "predictions"."user_id", 'member'
FROM "predictions"
WHERE NOT EXISTS (
	SELECT 1
	FROM "league_members"
	WHERE "league_members"."league_id" = "predictions"."league_id"
		AND "league_members"."user_id" = "predictions"."user_id"
);--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_league_user_membership_fk" FOREIGN KEY ("league_id","user_id") REFERENCES "public"."league_members"("league_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "predictions_league_user_match_row_unique" ON "predictions" USING btree ("league_id","user_id","match_id","prediction_row");--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "uses_two_prediction_rows";--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_prediction_row_check" CHECK ("predictions"."prediction_row" in (1, 2));

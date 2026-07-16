CREATE TABLE "final_settlement_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"prediction_row" integer DEFAULT 1 NOT NULL,
	"award_type" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"correct_tip_bonus" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "final_settlement_awards_prediction_row_check" CHECK ("final_settlement_awards"."prediction_row" in (1, 2)),
	CONSTRAINT "final_settlement_awards_type_check" CHECK ("final_settlement_awards"."award_type" in ('champion', 'total_goals', 'lucky_loser')),
	CONSTRAINT "final_settlement_awards_amount_cents_check" CHECK ("final_settlement_awards"."amount_cents" >= 0),
	CONSTRAINT "final_settlement_awards_correct_tip_bonus_check" CHECK ("final_settlement_awards"."correct_tip_bonus" >= 0)
);
--> statement-breakpoint
ALTER TABLE "final_settlement_awards" ADD CONSTRAINT "final_settlement_awards_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "final_settlement_awards" ADD CONSTRAINT "final_settlement_awards_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "final_settlement_awards" ADD CONSTRAINT "final_settlement_awards_league_user_membership_fk" FOREIGN KEY ("league_id","user_id") REFERENCES "public"."league_members"("league_id","user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "final_settlement_awards_unique" ON "final_settlement_awards" USING btree ("league_id","user_id","prediction_row","award_type");
--> statement-breakpoint
CREATE INDEX "final_settlement_awards_league_id_idx" ON "final_settlement_awards" USING btree ("league_id");

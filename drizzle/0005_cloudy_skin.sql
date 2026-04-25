ALTER TABLE "profiles" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "uses_two_prediction_rows" boolean DEFAULT false NOT NULL;
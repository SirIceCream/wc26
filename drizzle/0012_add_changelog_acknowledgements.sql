CREATE TABLE "user_changelog_acknowledgements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"changelog_key" text NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_changelog_acknowledgements" ADD CONSTRAINT "user_changelog_acknowledgements_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_changelog_ack_user_key_unique" ON "user_changelog_acknowledgements" USING btree ("user_id","changelog_key");
--> statement-breakpoint
CREATE INDEX "user_changelog_ack_user_id_idx" ON "user_changelog_acknowledgements" USING btree ("user_id");

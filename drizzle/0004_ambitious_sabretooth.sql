CREATE TABLE "app_metadata" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "app_metadata" ("key", "value", "description")
VALUES (
	'database_environment',
	'dev',
	'Marks this Supabase project as the development/testing database.'
)
ON CONFLICT ("key") DO UPDATE SET
	"value" = EXCLUDED."value",
	"description" = EXCLUDED."description",
	"updated_at" = now();

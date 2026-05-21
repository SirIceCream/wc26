UPDATE "leagues"
SET "name" = 'Private League',
    "updated_at" = now()
WHERE "slug" = 'the-usual-suspects';

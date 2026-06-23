# Agent Safety Rules

## Production Data

NEVER CREATE ADDITIONAL USERS OR TEST PROFILES.

- Do not enable or use local test-user mode against any configured database.
- Do not create temporary league members, profiles, predictions, or special predictions for UI checks.
- Do not write to production or shared databases for visual verification.
- Use existing authorized accounts, read-only inspection, screenshots supplied by the user, or local seed data that cannot reach the database.
- If a task seems to require a test user or synthetic database row, stop and ask first.

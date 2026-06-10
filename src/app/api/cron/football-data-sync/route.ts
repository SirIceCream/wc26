import { isDatabaseConfigured } from "@/db";
import { syncFootballDataMatches } from "@/lib/football-data/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Database is not configured" },
      { status: 500 },
    );
  }

  try {
    const result = await syncFootballDataMatches();

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Football-data sync failed",
      },
      { status: 500 },
    );
  }
}

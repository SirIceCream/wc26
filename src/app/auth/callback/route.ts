import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(next: string, origin: string) {
  const nextUrl = new URL(next, origin);

  return nextUrl.origin === origin ? nextUrl : new URL("/", origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next =
    requestUrl.searchParams.get("next") ??
    (type === "recovery" ? "/reset-password" : "/");
  const error = requestUrl.searchParams.get("error");

  const redirectUrl = new URL(requestUrl.origin);
  redirectUrl.pathname = "/login";

  if (error) {
    redirectUrl.search = "?message=auth-link-denied";
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.search = "?message=auth-callback-failed";
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    redirectUrl.search = "?message=auth-callback-failed";
    return NextResponse.redirect(redirectUrl);
  }

  const nextUrl = getSafeNextPath(next, requestUrl.origin);
  return NextResponse.redirect(nextUrl);
}

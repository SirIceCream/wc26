import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
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

  const nextUrl = new URL(next, requestUrl.origin);
  return NextResponse.redirect(nextUrl);
}

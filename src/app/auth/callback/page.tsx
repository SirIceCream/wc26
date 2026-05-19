"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getHashParams() {
  if (typeof window === "undefined" || !window.location.hash) {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.slice(1));
}

function AuthCallbackWorker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let active = true;

    async function confirmSession() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
          router.replace(next);
          router.refresh();
          return;
        }
      }

      const hashParams = getHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          router.replace(next);
          router.refresh();
          return;
        }
      }

      if (active) {
        setMessage("The sign-in link could not be verified.");
        router.replace("/login?message=auth-callback-failed");
      }
    }

    confirmSession();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-700 shadow-sm">
        {message}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center px-4">
          <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-700 shadow-sm">
            Signing you in...
          </div>
        </div>
      }
    >
      <AuthCallbackWorker />
    </Suspense>
  );
}

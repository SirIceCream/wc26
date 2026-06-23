"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SubmitButton } from "./submit-button";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/predict", label: "Tippabgabe" },
  { href: "/fixtures", label: "Spielplan" },
  { href: "/leaderboard", label: "Rangliste" },
  { href: "/profile", label: "Mein Profil" },
];

const JACK_BOT_WHATSAPP_URL = "https://wa.me/4367764724584";

type AppNavClientProps = {
  isAuthenticated: boolean;
  signOutAction: () => Promise<void>;
  userEmail: string | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function WhatsAppLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      aria-label="Jack Bot auf WhatsApp schreiben"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-[#25D366] text-sm font-black text-white shadow-sm transition hover:bg-[#1fb757] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2",
        compact ? "w-10" : "gap-2 px-3",
      )}
      href={JACK_BOT_WHATSAPP_URL}
      rel="noreferrer"
      target="_blank"
      title="Jack Bot auf WhatsApp schreiben"
    >
      {compact ? null : <span>Message Bot</span>}
      <svg
        aria-hidden="true"
        className="h-5 w-5 shrink-0"
        fill="currentColor"
        viewBox="0 0 32 32"
      >
        <path d="M16.04 3.2A12.7 12.7 0 0 0 3.35 15.88c0 2.24.59 4.43 1.72 6.36L3.2 28.8l6.72-1.77a12.62 12.62 0 0 0 6.12 1.56h.01A12.7 12.7 0 0 0 28.8 15.92 12.71 12.71 0 0 0 16.04 3.2Zm.01 23.24h-.01a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-3.99 1.05 1.06-3.89-.25-.4a10.49 10.49 0 1 1 8.92 4.93Zm5.75-7.85c-.31-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.37.24-.68.08-.31-.16-1.33-.49-2.53-1.56-.94-.84-1.57-1.87-1.75-2.18-.18-.32-.02-.49.14-.65.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.41 5.4 4.78.75.32 1.34.52 1.8.66.76.24 1.45.21 1.99.13.61-.09 1.86-.76 2.12-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.6-.37Z" />
      </svg>
    </a>
  );
}

export function AppNavClient({
  isAuthenticated,
  signOutAction,
  userEmail,
}: AppNavClientProps) {
  const pathname = usePathname();
  const isProfileRoute = isActive(pathname, "/profile");

  if (
    (!isAuthenticated && pathname === "/login") ||
    pathname === "/onboarding" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-sm font-black text-white">
              26
            </span>
            <span className="text-base font-black text-zinc-950">
              Jackpotspiel
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                  isActive(pathname, item.href) &&
                    "bg-emerald-50 text-emerald-900",
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <WhatsAppLink compact={isProfileRoute} />
            {isAuthenticated ? (
              <form
                action={signOutAction}
                className={cn(
                  isProfileRoute ? "block" : "hidden",
                  "md:block",
                )}
              >
                <SubmitButton
                  className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                  pendingLabel="Meldet ab..."
                  title={userEmail ?? undefined}
                  type="submit"
                >
                  Logout
                </SubmitButton>
              </form>
            ) : (
              <Link
                className="hidden rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 md:inline-flex"
                href="/login"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-2 pb-3 pt-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              className={cn(
                "rounded-lg px-2 py-2 text-center text-xs font-bold text-zinc-500",
                isActive(pathname, item.href) &&
                  "bg-emerald-50 text-emerald-900",
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

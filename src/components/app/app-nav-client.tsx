"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/predict", label: "Predict" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/profile", label: "Me" },
];

type AppNavClientProps = {
  isAuthenticated: boolean;
  signOutAction: () => Promise<void>;
  userEmail: string | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppNavClient({
  isAuthenticated,
  signOutAction,
  userEmail,
}: AppNavClientProps) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-sm font-black text-white">
              26
            </span>
            <span className="text-base font-black text-zinc-950">WC26 Predict</span>
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
          {isAuthenticated ? (
            <form action={signOutAction} className="hidden md:block">
              <button
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
                title={userEmail ?? undefined}
                type="submit"
              >
                Logout
              </button>
            </form>
          ) : (
            <Link
              className="hidden rounded-lg bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800 md:inline-flex"
              href="/login"
            >
              Login
            </Link>
          )}
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

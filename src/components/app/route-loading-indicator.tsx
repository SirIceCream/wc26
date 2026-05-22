"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type LoadingState = "finishing" | "idle" | "loading";

function shouldTrackNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const targetUrl = new URL(anchor.href);
  const currentUrl = new URL(window.location.href);

  if (targetUrl.origin !== currentUrl.origin) return false;

  return targetUrl.pathname !== currentUrl.pathname;
}

export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [state, setState] = useState<LoadingState>("idle");
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    function start() {
      if (finishTimer.current) {
        window.clearTimeout(finishTimer.current);
        finishTimer.current = null;
      }
      setState("loading");
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !shouldTrackNavigation(anchor, event)) return;

      start();
    }

    window.addEventListener("popstate", start);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("popstate", start);
      document.removeEventListener("click", handleClick, true);
      if (finishTimer.current) {
        window.clearTimeout(finishTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    setState((current) => {
      if (current !== "loading") return current;

      if (finishTimer.current) {
        window.clearTimeout(finishTimer.current);
      }
      finishTimer.current = window.setTimeout(() => {
        setState("idle");
        finishTimer.current = null;
      }, 260);

      return "finishing";
    });
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5 overflow-hidden transition-opacity duration-150",
        state === "idle" ? "opacity-0" : "opacity-100",
      )}
    >
      <div
        className={cn(
          "h-full bg-gradient-to-r from-emerald-700 via-yellow-300 to-emerald-800 shadow-[0_0_10px_rgba(234,179,8,0.45)] transition-[width] ease-out",
          state === "loading" && "w-3/4 duration-700",
          state === "finishing" && "w-full duration-200",
          state === "idle" && "w-0 duration-0",
        )}
      />
    </div>
  );
}

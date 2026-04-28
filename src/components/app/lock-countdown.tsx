"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatRemaining(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const days = Math.floor(safeMilliseconds / DAY);
  const hours = Math.floor((safeMilliseconds % DAY) / HOUR);
  const minutes = Math.floor((safeMilliseconds % HOUR) / MINUTE);
  const seconds = Math.floor((safeMilliseconds % MINUTE) / SECOND);

  return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export function LockCountdown({
  fallback,
  targetAt,
  tone = "light",
}: {
  fallback?: string;
  targetAt?: string;
  tone?: "dark" | "light";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, SECOND);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!targetAt) {
    return fallback ? (
      <div
        className={cn(
          "text-center text-xs font-black",
          tone === "dark" ? "text-yellow-200" : "text-amber-700",
        )}
      >
        {fallback}
      </div>
    ) : null;
  }

  const targetTime = new Date(targetAt).getTime();
  const remaining = targetTime - now;

  return (
    <div
      className={cn(
        "text-center text-xs font-black",
        tone === "dark" ? "text-yellow-200" : "text-amber-700",
      )}
    >
      {remaining > 0 ? (
        <>
          Noch{" "}
          <span className="tabular-nums" suppressHydrationWarning>
            {formatRemaining(remaining)}
          </span>
        </>
      ) : (
        "Gesperrt"
      )}
    </div>
  );
}

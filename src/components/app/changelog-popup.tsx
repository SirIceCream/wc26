"use client";

import { useState } from "react";
import type { ActiveChangelog } from "@/lib/changelog";
import { acknowledgeChangelog } from "@/lib/changelog/actions";
import { LoadingSpinner } from "./loading-spinner";

export function ChangelogPopup({
  changelog,
}: {
  changelog: ActiveChangelog | null;
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!changelog || isDismissed) return null;

  async function handleDismiss() {
    if (isSaving || !changelog) return;

    setIsSaving(true);
    setHasError(false);
    setIsDismissed(true);

    try {
      await acknowledgeChangelog(changelog.key);
    } catch {
      setIsDismissed(false);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/45 px-4 py-6 sm:items-center sm:py-10">
      <div
        aria-labelledby="changelog-title"
        aria-modal="true"
        className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-lg border border-emerald-100 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-5rem)] sm:p-5"
        role="dialog"
      >
        <div className="mb-3 inline-flex rounded-md bg-emerald-100 px-2 py-1 text-[0.65rem] font-black uppercase text-emerald-900">
          Update
        </div>
        <h2
          className="text-xl font-black leading-tight text-zinc-950"
          id="changelog-title"
        >
          {changelog.title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
          {changelog.body}
        </p>
        <ol className="mt-3 space-y-2 text-sm font-semibold leading-6 text-zinc-700">
          {changelog.items.map((item, index) => (
            <li className="flex gap-2" key={item}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[0.65rem] font-black text-emerald-900">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
        {hasError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
            Konnte noch nicht gespeichert werden. Bitte erneut versuchen.
          </p>
        ) : null}
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-black text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:bg-zinc-300"
          disabled={isSaving}
          onClick={handleDismiss}
          type="button"
        >
          {isSaving ? <LoadingSpinner /> : null}
          <span>OK, nicht mehr anzeigen</span>
        </button>
      </div>
    </div>
  );
}

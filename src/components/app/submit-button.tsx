"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  disabled,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className={cn("inline-flex items-center justify-center gap-2", className)}
      disabled={disabled || pending}
      {...props}
    >
      {pending ? <LoadingSpinner /> : null}
      <span>{pending ? pendingLabel ?? children : children}</span>
    </button>
  );
}

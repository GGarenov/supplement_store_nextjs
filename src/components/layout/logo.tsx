import Link from "next/link";

import { cn } from "@/lib/utils";

/** The two road-stripe mark, also used as the favicon (src/app/icon.svg). */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path
        d="M9 25 13 7h3l-4 18zM17 25l4-18h3l-4 18z"
        className="fill-primary-foreground"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Healthy Street home"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <LogoMark className="size-8" />
      <span className="font-heading text-xl leading-none font-bold tracking-wide uppercase">
        Healthy<span className="text-primary">Street</span>
      </span>
    </Link>
  );
}

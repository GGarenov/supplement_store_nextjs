import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Stars({ className }: { className?: string }) {
  return (
    <span className={cn("flex", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} className="aspect-square h-full w-auto shrink-0" />
      ))}
    </span>
  );
}

/**
 * Read-only stars. A filled row is laid over an empty row and clipped to the
 * rating, so 4.3 shows four and a third stars.
 */
export function RatingStars({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const starSize = size === "md" ? "h-5 w-25" : "h-3.5 w-17.5";
  const label =
    count === 0 ? "No reviews yet" : `Rated ${rating.toFixed(1)} out of 5`;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        role="img"
        aria-label={label}
        className={cn("relative block", starSize)}
      >
        <Stars className="text-muted-foreground/40 absolute inset-0" />
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${(Math.min(Math.max(rating, 0), 5) / 5) * 100}%` }}
        >
          {/* The fill goes on the svgs: lucide sets fill="none" on each one. */}
          <Stars className={cn("text-rating [&_svg]:fill-current", starSize)} />
        </span>
      </span>
      {count !== undefined && (
        <span className="text-muted-foreground text-xs">
          {count > 0 ? `(${count})` : "No reviews"}
        </span>
      )}
    </div>
  );
}

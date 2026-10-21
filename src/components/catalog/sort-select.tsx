"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SORT_OPTIONS,
  filtersHref,
  type Filters,
  type SortKey,
} from "@/lib/filters";

export function SortSelect({ filters }: { filters: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={filters.sort}
      disabled={pending}
      onValueChange={(sort) =>
        startTransition(() => {
          router.push(
            filtersHref(pathname, filters, { sort: sort as SortKey }),
            {
              scroll: false,
            },
          );
        })
      }
    >
      <SelectTrigger aria-label="Sort products" className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

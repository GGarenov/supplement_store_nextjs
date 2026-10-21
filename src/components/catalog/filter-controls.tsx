"use client";

import { StarIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { Facets } from "@/lib/catalog";
import {
  FORM_LABELS,
  RATING_OPTIONS,
  SIZE_OPTIONS,
  filtersHref,
  type Filters,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

const BRANDS_SHOWN = 8;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-sans text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function CheckOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  // An option with no results can't be picked, but stays untickable if already picked.
  const disabled = count === 0 && !checked;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 text-sm",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-muted-foreground text-xs">{count}</span>
      )}
    </label>
  );
}

function BrandFilter({
  brands,
  selected,
  onToggle,
}: {
  brands: Facets["brands"];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const matching = brands
    .filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    // Picked brands first, then the biggest.
    .sort(
      (a, b) =>
        Number(selected.includes(b.slug)) - Number(selected.includes(a.slug)) ||
        b.count - a.count,
    );
  const visible =
    expanded || query ? matching : matching.slice(0, BRANDS_SHOWN);

  return (
    <FilterSection title="Brand">
      {brands.length > BRANDS_SHOWN && (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a brand…"
          aria-label="Find a brand"
          className="h-8"
        />
      )}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {visible.map((b) => (
          <CheckOption
            key={b.slug}
            label={b.name}
            count={b.count}
            checked={selected.includes(b.slug)}
            onChange={() => onToggle(b.slug)}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground text-sm">No brands found.</p>
        )}
      </div>
      {!query && matching.length > BRANDS_SHOWN && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show fewer" : `Show all ${matching.length} brands`}
        </Button>
      )}
    </FilterSection>
  );
}

/**
 * Slider plus min/max inputs. The slider applies when released; the inputs on
 * blur or Enter, so typing "25" doesn't reload the page at "2".
 */
function PriceFilter({
  range,
  minPrice,
  maxPrice,
  onApply,
}: {
  range: Facets["priceRange"];
  minPrice?: number;
  maxPrice?: number;
  onApply: (min?: number, max?: number) => void;
}) {
  const [value, setValue] = useState<[number, number]>([
    minPrice ?? range.min,
    maxPrice ?? range.max,
  ]);

  // Prices at the ends of the range mean "no limit", so they aren't put in the URL.
  const apply = ([min, max]: number[]) =>
    onApply(
      min > range.min ? min : undefined,
      max < range.max ? max : undefined,
    );

  const commitInput = (index: 0 | 1, raw: string) => {
    const n = raw === "" ? (index === 0 ? range.min : range.max) : Number(raw);
    if (!Number.isFinite(n)) return;
    const next: [number, number] = [...value];
    next[index] = Math.min(Math.max(n, range.min), range.max);
    if (next[0] > next[1]) next.reverse();
    setValue(next);
    apply(next);
  };

  if (range.max <= range.min) return null;

  return (
    <FilterSection title="Price (€)">
      <Slider
        min={range.min}
        max={range.max}
        step={1}
        value={value}
        onValueChange={(v) => setValue([v[0], v[1]])}
        onValueCommit={apply}
        aria-label="Price range"
      />
      <div className="flex items-center gap-2">
        {([0, 1] as const).map((index) => (
          <Input
            key={`${index}-${value[index]}`}
            type="number"
            inputMode="decimal"
            min={range.min}
            max={range.max}
            defaultValue={value[index]}
            aria-label={index === 0 ? "Minimum price" : "Maximum price"}
            className="h-8"
            onBlur={(e) => commitInput(index, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitInput(index, e.currentTarget.value);
            }}
          />
        ))}
      </div>
    </FilterSection>
  );
}

export function FilterControls({
  facets,
  filters,
  hideBrands = false,
}: {
  facets: Facets;
  filters: Filters;
  /** On a brand page the brand filter makes no sense. */
  hideBrands?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const apply = (patch: Partial<Filters>) =>
    startTransition(() => {
      router.push(filtersHref(pathname, filters, patch), { scroll: false });
    });

  const sizeCounts = new Map(facets.sizes.map((s) => [s.value, s.count]));

  return (
    <div
      aria-busy={pending}
      className={cn("space-y-6 transition-opacity", pending && "opacity-60")}
    >
      {!hideBrands && (
        <BrandFilter
          brands={facets.brands}
          selected={filters.brands}
          onToggle={(slug) => apply({ brands: toggle(filters.brands, slug) })}
        />
      )}

      <PriceFilter
        // Remount when the URL or the range changes, so the slider resets to match.
        key={`${filters.minPrice}-${filters.maxPrice}-${facets.priceRange.min}-${facets.priceRange.max}`}
        range={facets.priceRange}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onApply={(minPrice, maxPrice) => apply({ minPrice, maxPrice })}
      />

      {facets.forms.length > 0 && (
        <FilterSection title="Form">
          <div className="space-y-2">
            {facets.forms.map((f) => (
              <CheckOption
                key={f.value}
                label={FORM_LABELS[f.value]}
                count={f.count}
                checked={filters.forms.includes(f.value)}
                onChange={() =>
                  apply({ forms: toggle(filters.forms, f.value) })
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Pack size">
        <div className="space-y-2">
          {SIZE_OPTIONS.map((s) => (
            <CheckOption
              key={s.value}
              label={
                <>
                  {s.label}
                  <span className="text-muted-foreground block text-xs">
                    {s.hint}
                  </span>
                </>
              }
              count={sizeCounts.get(s.value)}
              checked={filters.sizes.includes(s.value)}
              onChange={() => apply({ sizes: toggle(filters.sizes, s.value) })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rating">
        <div className="flex flex-col items-start gap-1">
          {RATING_OPTIONS.map((r) => {
            const active = filters.rating === r;
            return (
              <Button
                key={r}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={active}
                onClick={() => apply({ rating: active ? undefined : r })}
              >
                <StarIcon className="fill-rating text-rating" />
                {r} & up
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-2">
          <CheckOption
            label="On sale"
            checked={filters.sale}
            onChange={() => apply({ sale: !filters.sale })}
          />
          <CheckOption
            label="In stock"
            checked={filters.inStock}
            onChange={() => apply({ inStock: !filters.inStock })}
          />
        </div>
      </FilterSection>
    </div>
  );
}

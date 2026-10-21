import Link from "next/link";

import { getActiveBanners } from "@/lib/banners";

/**
 * Thin promo bar above the header, showing the first active STRIP banner.
 * Render it inside <Suspense>: the banner query runs at request time.
 */
export async function PromoStrip() {
  // No database yet (e.g. before Supabase is connected): just hide the strip.
  if (!process.env.DATABASE_URL) return null;

  let banner;
  try {
    [banner] = await getActiveBanners("STRIP");
  } catch (error) {
    // The strip is decoration; a database problem shouldn't break every page.
    console.error("PromoStrip: failed to load banners", error);
    return null;
  }
  if (!banner) return null;

  const text = (
    <>
      <span className="font-semibold">{banner.title}</span>
      {banner.subtitle && (
        <span className="hidden sm:inline"> · {banner.subtitle}</span>
      )}
    </>
  );

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
      {banner.ctaHref ? (
        <Link
          href={banner.ctaHref}
          className="underline-offset-4 hover:underline"
        >
          {text}
          {banner.ctaLabel && (
            <span className="ml-2 underline">{banner.ctaLabel}</span>
          )}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}

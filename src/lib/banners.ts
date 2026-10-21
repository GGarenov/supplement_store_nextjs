import { cacheLife, cacheTag } from "next/cache";

import type { BannerPlacement } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

/** Revalidate with `revalidateTag(BANNERS_TAG)` after an admin edits banners. */
export const BANNERS_TAG = "banners";

/** Active banners for a placement, filtered by their schedule and ordered for display. */
export async function getActiveBanners(placement: BannerPlacement) {
  "use cache";
  // Banners are scheduled, so the cached list refreshes every minute.
  cacheLife("minutes");
  cacheTag(BANNERS_TAG);

  const now = new Date();
  return db.banner.findMany({
    where: {
      placement,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

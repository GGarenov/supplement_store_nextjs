import { getRatingDistribution } from "@/lib/catalog";

import { RatingStars } from "./rating-stars";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
  user: { name: string | null };
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

/** Rating summary (average and a 5→1 breakdown) and the latest reviews. Read-only for now. */
export async function ProductReviews({
  productId,
  ratingAvg,
  ratingCount,
  reviews,
}: {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
  reviews: Review[];
}) {
  const distribution = await getRatingDistribution(productId);

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <h2
        id="reviews-heading"
        className="text-2xl font-bold tracking-wide uppercase"
      >
        Reviews
      </h2>

      {ratingCount === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-5xl font-bold">
                {ratingAvg.toFixed(1)}
              </span>
              <span className="text-muted-foreground">out of 5</span>
            </div>
            <RatingStars rating={ratingAvg} size="md" />
            <p className="text-muted-foreground text-sm">
              {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
            </p>
            <ul className="space-y-1.5">
              {distribution.map(({ stars, count }) => (
                <li key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-12">{stars} star</span>
                  <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <span
                      className="bg-rating block h-full"
                      style={{ width: `${(count / ratingCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-muted-foreground w-6 text-right text-xs">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="divide-y">
            {reviews.map((review) => (
              <li key={review.id} className="space-y-1.5 py-4 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <RatingStars rating={review.rating} />
                  {review.title && (
                    <p className="font-semibold">{review.title}</p>
                  )}
                </div>
                <p className="text-sm">{review.body}</p>
                <p className="text-muted-foreground text-xs">
                  {review.user.name ?? "Customer"} ·{" "}
                  {dateFormat.format(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

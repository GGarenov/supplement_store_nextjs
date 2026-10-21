import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Placeholder home page. Phase 3 adds the category grid and products; Phase 8 the hero carousel.
export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-6 px-4 py-20">
      <Badge className="bg-sale text-sale-foreground">Coming soon</Badge>
      <h1 className="max-w-2xl text-5xl font-bold tracking-wide uppercase sm:text-6xl">
        Fuel your <span className="text-primary">training</span>
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg">
        Protein, creatine, pre-workout and vitamins from the brands athletes
        trust. The store is under construction.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/c/protein">Shop protein</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/brands">Browse brands</Link>
        </Button>
      </div>
    </section>
  );
}

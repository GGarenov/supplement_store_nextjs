import Image from "next/image";
import Link from "next/link";

import { CATEGORY_TREE } from "@/lib/categories";

/** "Shop by category": one tile per top-level group. Static, so it needs no database. */
export function CategoryTiles() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {CATEGORY_TREE.map((group) => (
        <li key={group.slug}>
          <Link
            href={group.href}
            className="group bg-card hover:border-primary flex h-full flex-col items-center gap-3 rounded-xl border p-3 text-center transition-colors"
          >
            <span className="bg-tile relative block aspect-square w-full overflow-hidden rounded-lg">
              {group.image && (
                <Image
                  src={group.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 150px, (min-width: 640px) 25vw, 50vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </span>
            <span className="font-heading text-sm font-semibold tracking-wide uppercase">
              {group.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

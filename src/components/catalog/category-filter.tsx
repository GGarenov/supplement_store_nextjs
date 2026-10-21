import Link from "next/link";

import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";
import { cn } from "@/lib/utils";

function CategoryLink({
  node,
  activeSlug,
}: {
  node: CategoryNode;
  activeSlug: string;
}) {
  const active = node.slug === activeSlug;
  return (
    <Link
      href={node.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "hover:text-foreground block py-1 text-sm",
        active ? "text-primary font-semibold" : "text-muted-foreground",
      )}
    >
      {node.name}
    </Link>
  );
}

function Subtree({
  nodes,
  activeSlug,
}: {
  nodes: CategoryNode[];
  activeSlug: string;
}) {
  return (
    <ul className="ml-3 border-l pl-3">
      {nodes.map((node) => (
        <li key={node.slug}>
          <CategoryLink node={node} activeSlug={activeSlug} />
          {node.children.length > 0 && (
            <Subtree nodes={node.children} activeSlug={activeSlug} />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * All 7 groups, with the current group expanded. Category links don't keep
 * the filters: a brand picked in Protein may not exist in Vitamins.
 */
export function CategoryFilter({
  activeSlug,
  groupSlug,
}: {
  activeSlug: string;
  groupSlug: string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-sans text-sm font-semibold">Categories</h3>
      <ul>
        {CATEGORY_TREE.map((group) => (
          <li key={group.slug}>
            <CategoryLink node={group} activeSlug={activeSlug} />
            {group.slug === groupSlug && group.children.length > 0 && (
              <Subtree nodes={group.children} activeSlug={activeSlug} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

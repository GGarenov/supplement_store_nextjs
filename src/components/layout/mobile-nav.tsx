"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";
import { cn } from "@/lib/utils";

/** A link that also closes the sheet when followed. */
function NavLink({
  href,
  className,
  children,
}: React.ComponentProps<typeof Link>) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          "hover:bg-muted block rounded-md px-2 py-2 text-sm",
          className,
        )}
      >
        {children}
      </Link>
    </SheetClose>
  );
}

function CategoryLinks({
  nodes,
  depth = 0,
}: {
  nodes: CategoryNode[];
  depth?: number;
}) {
  return (
    <ul className={cn(depth > 0 && "ml-3 border-l pl-2")}>
      {nodes.map((node) => (
        <li key={node.slug}>
          <NavLink href={node.href}>{node.name}</NavLink>
          {node.children.length > 0 && (
            <CategoryLinks nodes={node.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

/** Hamburger menu with the category tree, shown below `lg`. */
export function MobileNav({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className={className}
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading uppercase">Shop</SheetTitle>
        </SheetHeader>
        <nav aria-label="Categories" className="px-4 pb-6">
          <Accordion type="single" collapsible>
            {CATEGORY_TREE.map((group) => (
              <AccordionItem key={group.slug} value={group.slug}>
                <AccordionTrigger className="hover:no-underline">
                  {group.name}
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline">
                  <NavLink
                    href={group.href}
                    className="text-primary font-semibold"
                  >
                    All {group.name}
                  </NavLink>
                  <CategoryLinks nodes={group.children} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-4 border-t pt-4">
            {/* -mx-2 cancels the links' padding so they line up with the rows above. */}
            <div className="-mx-2 space-y-1">
              <NavLink href="/brands">Brands</NavLink>
              <NavLink href="/sale" className="text-sale">
                Sale
              </NavLink>
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

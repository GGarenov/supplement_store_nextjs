"use client";

import { SlidersHorizontalIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * The filter sidebar in a bottom sheet, below `lg`. The sidebar is passed in
 * as children (rendered on the server), and refreshes in place as filters change.
 */
export function MobileFilters({
  activeCount,
  total,
  children,
}: {
  activeCount: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontalIcon data-icon="inline-start" />
          Filters
          {activeCount > 0 && <Badge className="ml-1">{activeCount}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle className="font-heading uppercase">Filters</SheetTitle>
          <SheetDescription className="sr-only">
            Narrow down the products.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4">{children}</div>
        <SheetFooter>
          <SheetClose asChild>
            <Button size="lg">Show {total} products</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

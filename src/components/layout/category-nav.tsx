import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { CATEGORY_TREE, type CategoryNode } from "@/lib/categories";
import { cn } from "@/lib/utils";

function MenuLink({
  href,
  className,
  children,
}: React.ComponentProps<typeof Link>) {
  return (
    <NavigationMenuLink asChild className={className}>
      <Link href={href}>{children}</Link>
    </NavigationMenuLink>
  );
}

function LinkList({
  nodes,
  className,
}: {
  nodes: CategoryNode[];
  className?: string;
}) {
  return (
    <ul className={className}>
      {nodes.map((node) => (
        <li key={node.slug}>
          <MenuLink href={node.href}>{node.name}</MenuLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Dropdown body for one group. Plain children form one column; children that
 * have their own children (Minerals, Vitamins) each get a column with a heading.
 */
function GroupPanel({ group }: { group: CategoryNode }) {
  const leaves = group.children.filter((c) => c.children.length === 0);
  const subgroups = group.children.filter((c) => c.children.length > 0);

  return (
    <div className="p-1">
      <MenuLink href={group.href} className="text-primary font-semibold">
        All {group.name}
      </MenuLink>
      {subgroups.length === 0 ? (
        <LinkList nodes={leaves} className="w-56" />
      ) : (
        <div className="mt-1 grid w-xl grid-cols-3 gap-x-2">
          {leaves.length > 0 && <LinkList nodes={leaves} />}
          {subgroups.map((sub) => (
            <div key={sub.slug}>
              <MenuLink href={sub.href} className="font-semibold">
                {sub.name}
              </MenuLink>
              <LinkList
                nodes={sub.children}
                className="text-muted-foreground ml-2 border-l pl-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Desktop category bar with a dropdown per group. Hidden below `lg`; see MobileNav. */
export function CategoryNav({ className }: { className?: string }) {
  return (
    <NavigationMenu
      viewport={false}
      className={cn("max-w-none justify-start", className)}
    >
      <NavigationMenuList className="flex-wrap justify-start">
        {CATEGORY_TREE.map((group) => {
          const wide = group.children.some((c) => c.children.length > 0);
          return (
            <NavigationMenuItem key={group.slug}>
              <NavigationMenuTrigger>{group.name}</NavigationMenuTrigger>
              {/* The wide panel opens leftwards so it stays on screen at 1024px. */}
              <NavigationMenuContent
                className={cn(wide && "md:right-0 md:left-auto")}
              >
                <GroupPanel group={group} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/brands">Brands</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className={cn(navigationMenuTriggerStyle(), "text-sale")}
          >
            <Link href="/sale">Sale</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

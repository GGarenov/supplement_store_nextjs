import { CategoryNav } from "./category-nav";
import { HeaderActions } from "./header-actions";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchForm } from "./search-form";

export function Header() {
  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <MobileNav className="-ml-2 lg:hidden" />
        <Logo />
        <SearchForm className="mx-auto hidden w-full max-w-xl md:block" />
        <div className="ml-auto md:ml-0">
          <HeaderActions />
        </div>
      </div>
      {/* Below md the search gets its own row. */}
      <div className="px-4 pb-3 md:hidden">
        <SearchForm />
      </div>
      <div className="mx-auto hidden max-w-7xl px-2 pb-2 lg:block">
        <CategoryNav />
      </div>
    </header>
  );
}

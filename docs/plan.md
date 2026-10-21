# Healthy Street — Project Plan

An online store for sports supplements, built with Next.js and React to practise full-stack skills. It is not a real store: payments run in **Stripe test mode** and no goods ship.

---

## 1. Decisions

| Area | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router) + React + **TypeScript** |
| Database | **PostgreSQL** + **Prisma** ORM |
| Auth | **Auth.js** (NextAuth v5): email/password + Google (or GitHub) OAuth |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix-based components) |
| Theme | **Dark by default**, with a light-mode toggle (`next-themes`) |
| Payments | **Stripe Checkout** (hosted page) + **webhooks** |
| Language / currency | English UI, prices in **EUR** |
| Profile | Order history and order details, wishlist, reviews and ratings |
| Admin | Basic role-protected `/admin` |
| Extras | Testing, CI/deploy, Docker and search are optional (see Phase 11) |

Supporting libraries:
- **Zod** to validate forms, Server Action inputs and webhook payloads
- **react-hook-form** for forms
- **Zustand** for the guest cart in `localStorage`
- **sonner** for toast notifications
- **embla-carousel** for the hero banner carousel (shadcn's Carousel uses it)
- **lucide-react** for icons

---

## 2. The catalog

Source: `images/**/products.json` plus the `.webp` images next to each file.

- **433 entries and 428 unique products.** 5 products appear in two categories, so a product can have **many categories**.
- **22 leaf categories** in **7 top-level groups**.
- **~90 brands.** The largest are NOW Foods (72), OstroVit (52), Kevin Levrone (28), Swedish Supplements (18), Applied Nutrition (16), Dorian Yates (12), Optimum Nutrition (10) and Peak (11).
- **Prices** range from €0.54 to €199.95.
- **Fields:** `id, brand, brandSlug, name, pack, price, image, url`.
- **Missing fields:** description, flavours, stock and ratings. The seed script generates or derives them (see §4).
- **Images** are product shots on a white background. They should sit on white or light cards, which matters for the dark theme.

### Category tree (folder → display name)

```
Protein
  └─ Whey Protein                    surovatachen-protein
Amino Acids
  ├─ BCAA                            BCAA
  └─ EAA                             EAA
Creatine
  └─ Creatine Monohydrate            kreatin-monohidrat
Weight Gain
  ├─ All-in-One                      gain_weight/all-in-one
  ├─ Carbohydrates                   gain_weight/Carbohydrates_products
  └─ Mass Gainers                    gain_weight/Gainers
Weight Loss
  ├─ Fat Burners                     losing_weight/fatburners
  ├─ Stim-Free Fat Burners           losing_weight/fatburners_without_stimulants
  └─ L-Carnitine                     losing_weight/l-carnitine
Pre-Workout
  ├─ Pump Formulas                   preworkout/azot_za_bodybuilders
  ├─ NO Boosters                     preworkout/azotni_busteri
  └─ Stim-Free NO Boosters           preworkout/azotni-busteri-bez-stimulanti
Vitamins & Minerals
  ├─ Men's Health                    Vitamins_and_minerals/Man_Health
  ├─ Women's Health                  Vitamins_and_minerals/Woman_Health
  ├─ Kids' Health                    Vitamins_and_minerals/Kids_Health
  ├─ Minerals
  │   ├─ Iron / Magnesium / Zinc
  └─ Vitamins
      ├─ Vitamin B / Vitamin C / Vitamin D
```

---

## 3. Feature proposals

### 3.1 Catalog and filtering
- **Category pages** at `/c/[...slug]`, e.g. `/c/vitamins-minerals/minerals/zinc`. A parent category shows the products of all its children.
- **Filters**, stored in the URL query string so they can be shared and the back button works:
  - Category (tree)
  - Brand (multi-select with search; there are ~90 brands)
  - Price range (slider and min/max inputs)
  - **Form**: powder / capsules / tablets / softgels / liquid, derived from `pack`
  - Pack size (e.g. ≤300 g, 300–1000 g, 1 kg+, or capsule count)
  - Minimum rating (★4+)
  - On sale only, in stock only
- **Facet counts** next to each option, e.g. "OstroVit (12)".
- **Sorting**: featured, price ↑/↓, newest, best rated, best selling.
- **Pagination**: numbered pages (simpler and better for SEO) or "Load more".
- **Brand pages** at `/brands` (A–Z grid) and `/brands/[slug]`.
- **Search**: a header search box that matches name and brand with a Postgres `ILIKE` query. Full-text search is a stretch goal.
- **Product page**: image gallery, brand, pack, price or sale price, quantity picker, add to cart, add to wishlist, stock badge, reviews and a "related products" carousel (same category).

### 3.2 Promotions and banners
- **Hero carousel** on the home page with 3–5 slides. Each slide has an image, a title, a subtitle, a CTA link and an optional countdown.
- **Promo strip**: a thin bar above the header, e.g. "Free shipping over €60".
- **Inline banners** between home-page sections, e.g. "Pre-Workout Week −20%".
- Banners have `startsAt`/`endsAt`, so they show and hide on schedule, and a `placement` (HERO / STRIP / INLINE).
- **Promotion rules** (simple version): a percentage off a **brand**, a **category** or a list of products during a date range. The effective price is computed on the server, and products show a "−20%" badge and a struck-through old price.
- **Discount codes**: Stripe **Promotion Codes** (`allow_promotion_codes: true` on Checkout). Codes such as `WELCOME10` are created in the Stripe dashboard or from the admin panel.
- **Home page sections**: Hero → Shop by category (7 tiles) → On sale → Best sellers → Featured brands → New arrivals.

### 3.3 Cart
- **Guest cart** in `localStorage` (Zustand `persist`).
- **User cart** in the database. On login the guest cart is **merged** into the database cart.
- A cart **drawer** (slide-over) opens from the header, and there is also a full `/cart` page.
- Quantity limits are checked against stock. The server recalculates the price on every change. The client price is only used for display.
- Free-shipping progress bar: "€12.40 away from free shipping".

### 3.4 Checkout (Stripe)
1. The user clicks **Checkout**. Login is required, which gives you practice with protected routes and redirects.
2. A **Server Action**:
   - loads the cart from the database
   - recomputes prices, including promotions
   - checks stock
   - creates an `Order` with status `PENDING` and `OrderItem` rows that store snapshots of the price and name
3. It creates a **Stripe Checkout Session**:
   - `line_items` built with `price_data`
   - `metadata.orderId`
   - Stripe collects the shipping address
   - `allow_promotion_codes`
   - `success_url` and `cancel_url`
4. Stripe redirects to the hosted checkout page. Test with card `4242 4242 4242 4242`.
5. The **webhook** `/api/webhooks/stripe` verifies the signature, then on `checkout.session.completed`:
   - marks the order `PAID` and stores the address and the Stripe IDs
   - decrements stock
   - clears the cart
   - is **idempotent**: if Stripe sends the same event twice, nothing happens twice
6. The `/checkout/success?session_id=…` page shows a summary of the order.
7. Also handle `checkout.session.expired`: mark the order `CANCELLED`.

Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` during local development.

### 3.5 User profile (`/account`)
- **Overview**: name, email, avatar, member since, total orders.
- **Orders**: a list with status badges (`PENDING · PAID · SHIPPED · DELIVERED · CANCELLED · REFUNDED`) and an order details page with items, totals, the shipping address, a status timeline and a "Buy again" button.
- **Wishlist**: a heart button on cards and on the product page, a wishlist page, and "Move to cart".
- **Reviews**: a 1–5 star rating with a title and text. Only **verified buyers** (a `PAID` order containing the product) can review, and each user can review a product once. "My reviews" lists the user's reviews and lets them edit or delete one.
- **Settings**: change name and password, delete account.

### 3.6 Admin (`/admin`, role `ADMIN`)
- **Dashboard**: revenue (test mode), order count, top products, low-stock list.
- **Products**: table with search and pagination; create/edit (name, brand, categories, price, stock, description, image upload, featured flag).
- **Orders**: list and filter by status; change the status (PAID → SHIPPED → DELIVERED); refund through the Stripe API (stretch).
- **Banners**: CRUD with a preview and a schedule.
- **Promotions**: CRUD for percentage-off rules.
- **Reviews**: moderation (hide or delete).
- Authorization is checked **on the server** in every admin Server Action and route, not only in the UI.

---

## 4. Data model (Prisma sketch)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  passwordHash  String?
  image         String?
  role          Role      @default(USER)
  accounts      Account[]  // Auth.js adapter models: Account, Session, VerificationToken
  sessions      Session[]
  cart          Cart?
  orders        Order[]
  wishlist      WishlistItem[]
  reviews       Review[]
  createdAt     DateTime  @default(now())
}
enum Role { USER ADMIN }

model Brand {
  id       String    @id @default(cuid())
  slug     String    @unique
  name     String
  logo     String?
  featured Boolean   @default(false)
  products Product[]
}

model Category {
  id        String     @id @default(cuid())
  slug      String     @unique
  name      String
  image     String?
  parentId  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  products  Product[]  // implicit many-to-many
  sortOrder Int        @default(0)
}

model Product {
  id          String      @id @default(cuid())
  sourceId    String      @unique      // id from products.json
  slug        String      @unique      // e.g. "ostrovit-bcaa-400g-20848"
  name        String
  description String?
  brandId     String
  brand       Brand       @relation(fields: [brandId], references: [id])
  categories  Category[]
  priceCents  Int                      // always store money as integer cents
  stock       Int         @default(0)
  form        ProductForm              // derived from `pack`
  packAmount  Int                      // 400
  packUnit    PackUnit                 // GRAMS | CAPSULES | TABLETS | SOFTGELS | ML
  packLabel   String                   // "400 g"
  image       String                   // "/products/20848.webp"
  featured    Boolean     @default(false)
  ratingAvg   Float       @default(0)  // denormalised, updated when reviews change
  ratingCount Int         @default(0)
  soldCount   Int         @default(0)  // for "best sellers"
  createdAt   DateTime    @default(now())
  @@index([brandId])
  @@index([priceCents])
}

model Cart     { id String @id @default(cuid()); userId String @unique; items CartItem[]; updatedAt DateTime @updatedAt }
model CartItem { id String @id @default(cuid()); cartId String; productId String; quantity Int; @@unique([cartId, productId]) }

model Order {
  id              String      @id @default(cuid())
  number          Int         @unique @default(autoincrement())  // shown as HS-000123
  userId          String
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  subtotalCents   Int
  discountCents   Int         @default(0)
  shippingCents   Int
  totalCents      Int
  stripeSessionId String?     @unique
  stripePaymentIntentId String?
  shippingAddress Json?
  createdAt       DateTime    @default(now())
  paidAt          DateTime?
}
enum OrderStatus { PENDING PAID SHIPPED DELIVERED CANCELLED REFUNDED }

model OrderItem {               // snapshot: later price/name changes do not alter past orders
  id String @id @default(cuid()); orderId String; productId String
  name String; image String; unitPriceCents Int; quantity Int
}

model WishlistItem { userId String; productId String; createdAt DateTime @default(now()); @@id([userId, productId]) }

model Review {
  id String @id @default(cuid()); userId String; productId String
  rating Int; title String?; body String; hidden Boolean @default(false)
  createdAt DateTime @default(now())
  @@unique([userId, productId])
}

model Banner {
  id String @id @default(cuid()); title String; subtitle String?; image String
  ctaLabel String?; ctaHref String?; placement BannerPlacement
  startsAt DateTime?; endsAt DateTime?; active Boolean @default(true); sortOrder Int @default(0)
}
enum BannerPlacement { HERO STRIP INLINE }

model Promotion {
  id String @id @default(cuid()); name String; percentOff Int
  brandId String?; categoryId String?; productIds String[]
  startsAt DateTime; endsAt DateTime; active Boolean @default(true)
}
```

### Seed script (`prisma/seed.ts`)
1. Walk `images/**/products.json` and map each folder to a category using the tree in §2.
2. Upsert brands by `brandSlug`. Upsert products by `sourceId`. Connect each product to **all** of its categories, which handles the 5 duplicates.
3. Parse `pack`:
   - `"60 капсули"` → 60 CAPSULES, "60 capsules"
   - `"400 грама"` → 400 GRAMS, "400 g"
   - also handle "Таблетки", "Гел капсули", "мл" and others
   - log any value it cannot parse so you can add a rule for it
4. Convert `price` "12.26" to `priceCents` 1226.
5. Copy each image to `public/products/<sourceId>.webp`.
6. Generate fake data deterministically with a fixed-seed **faker**:
   - stock (0–150, with a few products out of stock)
   - `soldCount`
   - short descriptions
   - a few seed users and reviews
   - an admin user
   - 3–4 banners and 2 promotions
7. Make the script idempotent: `npm run db:seed` can be run again safely.

> Note: `.gitignore` currently ignores `/images` and `/docs`. Decide whether to commit `public/products/` (≈ a few MB of webp files) so the app works after a fresh clone, and remove `/docs` from `.gitignore` if you want this plan in git.

---

## 5. Routes

```
/                                  Home: hero carousel, categories, sale, best sellers, brands
/c/[...slug]                       Category listing + filters
/brands, /brands/[slug]            Brand index / brand listing
/p/[slug]                          Product details
/search?q=                         Search results (same listing UI)
/sale                              All products on promotion
/cart                              Full cart page
/checkout/success, /checkout/cancel
/login, /register
/account                           Profile overview (protected)
/account/orders, /account/orders/[number]
/account/wishlist, /account/reviews, /account/settings
/admin, /admin/products, /admin/orders, /admin/banners, /admin/promotions, /admin/reviews
/api/auth/[...nextauth]            Auth.js
/api/webhooks/stripe               Stripe webhook (route handler, raw body)
```

Rendering approach:
- Listing and product pages are **Server Components** that query Prisma directly.
- Mutations (cart, wishlist, reviews, admin) go through **Server Actions**.
- Interactive parts are small Client Components: filters, cart drawer, carousel, theme toggle.
- Route groups (`(shop)`, `(account)`, `(admin)`) give each area its own layout.
- `middleware.ts` (or the Auth.js `authorized` callback) protects `/account` and `/admin`.
- Use `loading.tsx` / `error.tsx` / `not-found.tsx` in every segment.

### Folder structure

```
src/
  app/
    (shop)/ … (account)/account/ … (admin)/admin/ … api/
  components/
    ui/                 shadcn components
    layout/             Header, Footer, PromoStrip, ThemeToggle, MobileNav
    product/            ProductCard, ProductGrid, PriceTag, RatingStars, Gallery
    catalog/            FilterSidebar, SortSelect, Pagination, ActiveFilters
    cart/               CartDrawer, CartLine, FreeShippingBar
    home/               HeroCarousel, CategoryTiles, BrandStrip
  lib/
    db.ts               Prisma client singleton
    auth.ts             Auth.js config
    stripe.ts           Stripe client
    pricing.ts          effective price / promotion logic (pure, unit-testable)
    catalog.ts          filter → Prisma `where` builder, facet queries
    validators/         Zod schemas
  actions/              Server Actions: cart.ts, wishlist.ts, review.ts, checkout.ts, admin/*
  stores/cart.ts        Zustand guest cart
prisma/ schema.prisma, seed.ts, category-map.ts
```

---

## 6. Design direction

**Concept:** dark, energetic, "street gym". It should feel premium, without the neon clutter typical of supplement sites.

| Token | Dark (default) | Light |
|---|---|---|
| Background | `#0B0D10` | `#F7F8FA` |
| Surface / card | `#15181D` | `#FFFFFF` |
| Border | `#262A31` | `#E4E7EC` |
| Text | `#F2F4F7` | `#101418` |
| Muted text | `#9AA3AF` | `#5B6472` |
| **Primary (brand green)** | `#84CC16` (lime) | `#4D7C0F` |
| Sale / accent | `#F97316` (orange) | `#EA580C` |
| Rating stars | `#FACC15` | `#EAB308` |

- **Product images** go on a **white rounded tile** inside the dark card, so the white-background photos look clean instead of looking like white boxes.
- **Typography:**
  - headings in a condensed sporty font, e.g. **Oswald** or **Barlow Condensed**, uppercase for section titles
  - body text in **Inter**
  - both loaded with `next/font`
- **Logo:** a wordmark, "HEALTHY" in white and "STREET" in lime, with a small road-stripe or dumbbell mark.
- **Product card:**
  - image tile
  - brand (small, muted)
  - name (2 lines max)
  - pack label
  - rating
  - price, with the old price struck through
  - "Add to cart" button that appears on hover on desktop and is always visible on mobile
  - "−20%" and "Out of stock" badges
- **Mobile first:**
  - filters in a bottom sheet
  - sticky "Add to cart" bar on the product page
  - hamburger menu with the category tree
- Implement theming with CSS variables in `globals.css`, mapped to Tailwind and shadcn tokens. `next-themes` sets `defaultTheme="dark"`.

---

## 7. Implementation phases

Each phase ends with something you can see working.

### Phase 0 — Project setup
- `npx create-next-app@latest` with TypeScript, Tailwind, ESLint, App Router and `src/`.
- `npx shadcn@latest init` and add button, card, input, sheet, dialog, dropdown-menu, select, slider, checkbox, badge, carousel, skeleton, sonner and table.
- Set up Postgres: **Docker** (`docker run postgres`) or a free **Neon** database.
- Add `prisma init`, `.env` / `.env.example` and the Prettier Tailwind plugin.
- **Done when:** the app runs and the Prisma client connects.

### Phase 1 — Data and seeding
- Write the schema (§4) and run the first migration.
- Write the category map, `pack` parser and seed script.
- Copy images to `public/products`.
- **Done when:** `npm run db:seed` loads 428 products, ~90 brands and 22+7 categories. Check in Prisma Studio.

### Phase 2 — Layout and design system
- Theme tokens, fonts, `next-themes` toggle.
- Header with logo, category mega-menu, search, account icon and cart icon with a count; footer; promo strip.
- **Done when:** the empty pages share the layout and dark/light switching works.

### Phase 3 — Catalog
- Product card and grid.
- Category pages with **filters, facet counts, sort and pagination** driven by URL params.
- Brand pages, product details page, basic search.
- Skeleton loading states, `generateMetadata` for SEO.
- **Done when:** you can browse every category and combine brand, price and form filters.

### Phase 4 — Authentication
- Auth.js with the Prisma adapter.
- Credentials provider (bcrypt), plus Google or GitHub OAuth.
- Register and login pages using Zod and react-hook-form.
- `USER`/`ADMIN` role in the session; protected routes.
- **Done when:** a user can register, log in and log out, and `/account` redirects when logged out.

### Phase 5 — Cart
- Zustand guest cart and database cart via Server Actions.
- Merge the guest cart into the database cart on login.
- Cart drawer and page, stock checks, free-shipping bar.
- **Done when:** the cart survives a refresh and a login, and the totals are computed on the server.

### Phase 6 — Stripe checkout and orders
- Checkout Server Action → `Order` (PENDING) → Checkout Session.
- Webhook handler with signature verification and idempotency.
- Success and cancel pages.
- **Done when:** a test payment marks the order PAID, reduces stock and empties the cart.

### Phase 7 — Profile
- Account overview, order list and order details with a status timeline.
- Wishlist.
- Reviews: verified buyers only; update `ratingAvg`/`ratingCount` in a transaction.
- Settings.
- **Done when:** after buying a product the user sees the order and can review the product, and the stars show on its card.

### Phase 8 — Promotions and banners
- `Banner` and `Promotion` queries and the `pricing.ts` effective-price logic.
- Hero carousel, inline banners, `/sale` page, sale badges.
- Stripe promotion codes at checkout.
- **Done when:** an active promotion changes the prices shown everywhere, including in Stripe Checkout.

### Phase 9 — Admin
- Admin layout and server-side role guard.
- Dashboard stats; CRUD for products, banners and promotions.
- Order status updates, review moderation.
- **Done when:** an admin can create a banner that appears on the home page and ship an order. The customer then sees the status change.

### Phase 10 — Polish
- Empty states, error boundaries, 404 page, toasts.
- Accessibility: keyboard navigation, focus rings, alt text, contrast in both themes.
- Responsive pass, `next/image` sizes, Lighthouse check, README with setup instructions.

### Phase 11 — Stretch goals (optional, pick any)
- **Testing**: Vitest for `pricing.ts`, the `pack` parser and the filter builder; Playwright for browse → add to cart → Stripe test checkout.
- **CI/CD**: GitHub Actions (lint, typecheck, test, build) and deploy to **Vercel** with Neon Postgres. Register the Stripe webhook endpoint for the deployed URL.
- **Docker**: `docker-compose.yml` for Postgres (and the app).
- **Search**: Postgres full-text search with `tsvector`, plus header autocomplete.
- **Emails**: an order confirmation email (Resend + React Email).
- **Refunds** from the admin panel through the Stripe API, handling the `charge.refunded` webhook.
- **Recently viewed** products, a "Frequently bought together" section, product comparison.
- **Flavours / variants** (a `ProductVariant` model), which adds data-modelling practice.

---

## 8. Key learning goals
- Server Components vs Client Components, and where state belongs.
- Server Actions with validation and authorization.
- URL-driven state for filters.
- Relational data modelling: many-to-many relations, tree structures, price snapshots.
- Money handling: integer cents, recomputing prices on the server.
- Auth sessions, roles and route protection.
- Stripe Checkout, webhooks, signature verification and idempotency.
- Theming with CSS variables; responsive and accessible UI.

---

## 9. Open questions for later
- Is shipping a flat fee (e.g. €4.99, free over €60) or a choice between options in Stripe Checkout?
- Should a guest be able to check out, or is login required? (The plan currently requires login.)
- Should stock be reserved when an order is created (PENDING), or only decremented when it is paid? (The plan currently decrements on payment.)
- Should the stretch goals be scheduled now (§7 Phase 11)?

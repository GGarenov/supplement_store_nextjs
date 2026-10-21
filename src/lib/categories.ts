/**
 * Category tree for the store. Used by the seed (to create the categories) and
 * by the site navigation. Categories aren't editable in the admin, so this file
 * is the source of truth for the tree.
 *
 * `folder` is the path under `images/` that holds the products.json and images
 * for that category. Only leaf categories have a folder. Parents must be listed
 * before their children (the seed relies on this order).
 */
export type CategoryDef = {
  slug: string;
  name: string;
  parentSlug: string | null;
  sortOrder: number;
  folder?: string;
};

export const CATEGORIES: CategoryDef[] = [
  // Top-level groups
  { slug: "protein", name: "Protein", parentSlug: null, sortOrder: 1 },
  { slug: "amino-acids", name: "Amino Acids", parentSlug: null, sortOrder: 2 },
  { slug: "creatine", name: "Creatine", parentSlug: null, sortOrder: 3 },
  { slug: "weight-gain", name: "Weight Gain", parentSlug: null, sortOrder: 4 },
  { slug: "weight-loss", name: "Weight Loss", parentSlug: null, sortOrder: 5 },
  { slug: "pre-workout", name: "Pre-Workout", parentSlug: null, sortOrder: 6 },
  {
    slug: "vitamins-minerals",
    name: "Vitamins & Minerals",
    parentSlug: null,
    sortOrder: 7,
  },

  // Protein
  {
    slug: "whey-protein",
    name: "Whey Protein",
    parentSlug: "protein",
    sortOrder: 1,
    folder: "surovatachen-protein",
  },

  // Amino Acids
  {
    slug: "bcaa",
    name: "BCAA",
    parentSlug: "amino-acids",
    sortOrder: 1,
    folder: "BCAA",
  },
  {
    slug: "eaa",
    name: "EAA",
    parentSlug: "amino-acids",
    sortOrder: 2,
    folder: "EAA",
  },

  // Creatine
  {
    slug: "creatine-monohydrate",
    name: "Creatine Monohydrate",
    parentSlug: "creatine",
    sortOrder: 1,
    folder: "kreatin-monohidrat",
  },

  // Weight Gain
  {
    slug: "all-in-one",
    name: "All-in-One",
    parentSlug: "weight-gain",
    sortOrder: 1,
    folder: "gain_weight/all-in-one",
  },
  {
    slug: "carbohydrates",
    name: "Carbohydrates",
    parentSlug: "weight-gain",
    sortOrder: 2,
    folder: "gain_weight/Carbohydrates_products",
  },
  {
    slug: "mass-gainers",
    name: "Mass Gainers",
    parentSlug: "weight-gain",
    sortOrder: 3,
    folder: "gain_weight/Gainers",
  },

  // Weight Loss
  {
    slug: "fat-burners",
    name: "Fat Burners",
    parentSlug: "weight-loss",
    sortOrder: 1,
    folder: "losing_weight/fatburners",
  },
  {
    slug: "stim-free-fat-burners",
    name: "Stim-Free Fat Burners",
    parentSlug: "weight-loss",
    sortOrder: 2,
    folder: "losing_weight/fatburners_without_stimulants",
  },
  {
    slug: "l-carnitine",
    name: "L-Carnitine",
    parentSlug: "weight-loss",
    sortOrder: 3,
    folder: "losing_weight/l-carnitine",
  },

  // Pre-Workout
  {
    slug: "pump-formulas",
    name: "Pump Formulas",
    parentSlug: "pre-workout",
    sortOrder: 1,
    folder: "preworkout/azot_za_bodybuilders",
  },
  {
    slug: "no-boosters",
    name: "NO Boosters",
    parentSlug: "pre-workout",
    sortOrder: 2,
    folder: "preworkout/azotni_busteri",
  },
  {
    slug: "stim-free-no-boosters",
    name: "Stim-Free NO Boosters",
    parentSlug: "pre-workout",
    sortOrder: 3,
    folder: "preworkout/azotni-busteri-bez-stimulanti",
  },

  // Vitamins & Minerals
  {
    slug: "mens-health",
    name: "Men's Health",
    parentSlug: "vitamins-minerals",
    sortOrder: 1,
    folder: "Vitamins_and_minerals/Man_Health",
  },
  {
    slug: "womens-health",
    name: "Women's Health",
    parentSlug: "vitamins-minerals",
    sortOrder: 2,
    folder: "Vitamins_and_minerals/Woman_Health",
  },
  {
    slug: "kids-health",
    name: "Kids' Health",
    parentSlug: "vitamins-minerals",
    sortOrder: 3,
    folder: "Vitamins_and_minerals/Kids_Health",
  },
  {
    slug: "minerals",
    name: "Minerals",
    parentSlug: "vitamins-minerals",
    sortOrder: 4,
  },
  {
    slug: "vitamins",
    name: "Vitamins",
    parentSlug: "vitamins-minerals",
    sortOrder: 5,
  },

  // Minerals
  {
    slug: "iron",
    name: "Iron",
    parentSlug: "minerals",
    sortOrder: 1,
    folder: "Vitamins_and_minerals/Minerals/Iron",
  },
  {
    slug: "magnesium",
    name: "Magnesium",
    parentSlug: "minerals",
    sortOrder: 2,
    folder: "Vitamins_and_minerals/Minerals/Magnesium",
  },
  {
    slug: "zinc",
    name: "Zinc",
    parentSlug: "minerals",
    sortOrder: 3,
    folder: "Vitamins_and_minerals/Minerals/Zinc",
  },

  // Vitamins
  {
    slug: "vitamin-b",
    name: "Vitamin B",
    parentSlug: "vitamins",
    sortOrder: 1,
    folder: "Vitamins_and_minerals/Vitamins/Vitamin_B",
  },
  {
    slug: "vitamin-c",
    name: "Vitamin C",
    parentSlug: "vitamins",
    sortOrder: 2,
    folder: "Vitamins_and_minerals/Vitamins/Vitamin_C",
  },
  {
    slug: "vitamin-d",
    name: "Vitamin D",
    parentSlug: "vitamins",
    sortOrder: 3,
    folder: "Vitamins_and_minerals/Vitamins/Vitamin_D",
  },
];

export const LEAF_CATEGORIES = CATEGORIES.filter(
  (c): c is CategoryDef & { folder: string } => c.folder !== undefined,
);

export type CategoryNode = {
  slug: string;
  name: string;
  /** Listing URL built from the slug path, e.g. "/c/vitamins-minerals/minerals/zinc". */
  href: string;
  children: CategoryNode[];
};

function buildTree(
  parentSlug: string | null,
  basePath: string,
): CategoryNode[] {
  return CATEGORIES.filter((c) => c.parentSlug === parentSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => {
      const href = `${basePath}/${c.slug}`;
      return {
        slug: c.slug,
        name: c.name,
        href,
        children: buildTree(c.slug, href),
      };
    });
}

/** The 7 top-level groups with their nested children. */
export const CATEGORY_TREE: CategoryNode[] = buildTree(null, "/c");

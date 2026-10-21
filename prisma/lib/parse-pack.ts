/**
 * Parses the Bulgarian `pack` strings from products.json, e.g. "60 капсули" or
 * "400 грама", into structured data with an English label.
 *
 * The unit and form names match the `PackUnit` and `ProductForm` enums in
 * schema.prisma.
 */

export type PackUnit =
  | "GRAMS"
  | "ML"
  | "CAPSULES"
  | "SOFTGELS"
  | "TABLETS"
  | "GUMMIES"
  | "SACHETS"
  | "PATCHES";

export type ProductForm =
  | "POWDER"
  | "CAPSULES"
  | "SOFTGELS"
  | "TABLETS"
  | "LIQUID"
  | "GUMMIES"
  | "OTHER";

export type ParsedPack = {
  /** Total amount in `unit` (e.g. grams or capsule count), rounded. */
  amount: number;
  unit: PackUnit;
  form: ProductForm;
  /** English display label, e.g. "60 capsules". */
  label: string;
};

type UnitRule = {
  /** Bulgarian unit text, matched case-insensitively. */
  bg: string;
  unit: PackUnit;
  form: ProductForm;
  /** English unit used in the label. */
  en: string;
};

// Order matters: more specific phrases must come before the words they contain
// (e.g. "дъвчащи гел капсули" before "гел капсули" before "капсули").
const UNIT_RULES: UnitRule[] = [
  {
    bg: "дъвчащи гел капсули",
    unit: "SOFTGELS",
    form: "SOFTGELS",
    en: "chewable softgels",
  },
  { bg: "гел капсули", unit: "SOFTGELS", form: "SOFTGELS", en: "softgels" },
  { bg: "капсули", unit: "CAPSULES", form: "CAPSULES", en: "capsules" },
  {
    bg: "дъвчащи таблетки",
    unit: "TABLETS",
    form: "TABLETS",
    en: "chewable tablets",
  },
  {
    bg: "подезични таблетки",
    unit: "TABLETS",
    form: "TABLETS",
    en: "sublingual tablets",
  },
  {
    bg: "ефервесцентни таблетки",
    unit: "TABLETS",
    form: "TABLETS",
    en: "effervescent tablets",
  },
  {
    bg: "разтворими таблетки",
    unit: "TABLETS",
    form: "TABLETS",
    en: "soluble tablets",
  },
  { bg: "таблетки", unit: "TABLETS", form: "TABLETS", en: "tablets" },
  {
    bg: "дъвчащи дражета",
    unit: "TABLETS",
    form: "TABLETS",
    en: "chewable dragées",
  },
  { bg: "желирани бонбони", unit: "GUMMIES", form: "GUMMIES", en: "gummies" },
  { bg: "пакета", unit: "SACHETS", form: "POWDER", en: "sachets" },
  { bg: "пластира", unit: "PATCHES", form: "OTHER", en: "patches" },
  { bg: "грама", unit: "GRAMS", form: "POWDER", en: "g" },
  { bg: "мл", unit: "ML", form: "LIQUID", en: "ml" },
];

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

function toNumber(s: string): number {
  return parseFloat(s.replace(",", "."));
}

function findRule(text: string): UnitRule | undefined {
  const lower = text.toLowerCase();
  return UNIT_RULES.find((r) => lower.includes(r.bg));
}

/** Formats an amount and English unit: "400 g", "60 capsules". */
function formatAmount(amount: string | number, en: string): string {
  return `${amount} ${en}`;
}

/**
 * Returns the parsed pack, or `null` if the string cannot be understood.
 * The caller decides how to handle `null` (the seed logs it and falls back).
 */
export function parsePack(raw: string): ParsedPack | null {
  const text = raw.trim();

  // "1054 грама + 63 капсули": a combo pack. The first part is the main product.
  const [main, extra] = text.split("+").map((p) => p.trim());
  if (extra) {
    const mainPack = parsePack(main);
    const extraRule = findRule(extra);
    const extraNum = extra.match(new RegExp(NUM));
    if (!mainPack || !extraRule || !extraNum) return null;
    return {
      ...mainPack,
      label: `${mainPack.label} + ${formatAmount(extraNum[1], extraRule.en)}`,
    };
  }

  const rule = findRule(text);
  if (!rule) return null;

  // "2 x 9 грама" / "20 x 1.4 грама": multipacks. Amount is the total.
  const multi = text.match(new RegExp(`^${NUM}\\s*[xх×]\\s*${NUM}`, "i"));
  if (multi) {
    const count = toNumber(multi[1]);
    const each = toNumber(multi[2]);
    return {
      amount: Math.round(count * each),
      unit: rule.unit,
      form: rule.form,
      label: `${multi[1]} × ${formatAmount(multi[2], rule.en)}`,
    };
  }

  // "600-750 грама" / "2000~2084 грама": a range (varies by flavour).
  // Amount is the upper bound so "1 kg+" filters include it.
  const range = text.match(new RegExp(`^${NUM}\\s*[-~–]\\s*${NUM}`));
  if (range) {
    return {
      amount: Math.round(toNumber(range[2])),
      unit: rule.unit,
      form: rule.form,
      label: `${range[1]}–${formatAmount(range[2], rule.en)}`,
    };
  }

  // "60 капсули" / "400 грама": the common case.
  const single = text.match(new RegExp(`^${NUM}`));
  if (single) {
    return {
      amount: Math.round(toNumber(single[1])),
      unit: rule.unit,
      form: rule.form,
      label: formatAmount(single[1], rule.en),
    };
  }

  return null;
}

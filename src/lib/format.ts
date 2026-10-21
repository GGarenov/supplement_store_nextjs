const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

/** Formats integer cents as euros, e.g. 1226 → "€12.26". */
export function formatPrice(cents: number): string {
  return eur.format(cents / 100);
}

/** Currency handling: amounts are always shown in the circle's own
 *  currency and never converted (Requirement 7.2). */

export const CURRENCIES: { code: string; label: string }[] = [
  { code: "NGN", label: "NGN — Nigerian naira" },
  { code: "XOF", label: "XOF — West African CFA franc" },
  { code: "GHS", label: "GHS — Ghanaian cedi" },
  { code: "KES", label: "KES — Kenyan shilling" },
  { code: "ZAR", label: "ZAR — South African rand" },
  { code: "USD", label: "USD — US dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British pound" },
];

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

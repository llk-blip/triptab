// Money utilities. All amounts are stored as integer minor units (cents).

export const CURRENCIES: { code: string; name: string }[] = [
  { code: "SGD", name: "Singapore Dollar" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KRW", name: "South Korean Won" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "TWD", name: "New Taiwan Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "AED", name: "UAE Dirham" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

// Currencies whose minor unit IS the major unit (no cents).
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);

export function decimalsFor(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

export function minorFactor(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 1 : 100;
}

/** Parse user input like "12.34" into integer minor units. Throws on bad input. */
export function toMinor(input: string, currency: string): number {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error(`Invalid amount: "${input}"`);
  }
  const value = Number(cleaned);
  const minor = Math.round(value * minorFactor(currency));
  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new Error(`Amount out of range: "${input}"`);
  }
  return minor;
}

/** Format minor units as a localized currency string, e.g. 1234 → "$12.34". */
export function formatMinor(minor: number, currency: string): string {
  const value = minor / minorFactor(currency);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: decimalsFor(currency),
      maximumFractionDigits: decimalsFor(currency),
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(decimalsFor(currency))}`;
  }
}

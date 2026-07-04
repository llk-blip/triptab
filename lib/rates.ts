import { prisma } from "./prisma";
import { minorFactor } from "./money";

// Live exchange rates with a per-day database cache.
//
// Default source: https://open.er-api.com — free, no API key required,
// updates daily. If EXCHANGE_RATE_API_KEY is set in .env, the keyed
// exchangerate-api.com endpoint is used instead (higher limits).
//
// We always fetch rates FROM the trip's base currency; converting any
// expense currency to base is then amount ÷ rate[currency]. One cached
// row per base per day covers every currency on the trip.

export class RatesUnavailableError extends Error {
  constructor(base: string) {
    super(
      `Exchange rates for ${base} are unavailable (no internet and no cached rates yet).`
    );
    this.name = "RatesUnavailableError";
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchRatesFromApi(base: string): Promise<Record<string, number>> {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  const url = key
    ? `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`
    : `https://open.er-api.com/v6/latest/${base}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Rate API returned ${res.status}`);
  const data = await res.json();
  if (data.result !== "success") throw new Error(`Rate API error: ${data["error-type"]}`);
  const rates = (data.conversion_rates ?? data.rates) as Record<string, number>;
  if (!rates || typeof rates !== "object") throw new Error("Rate API returned no rates");
  return rates;
}

/** Rates table for `base` (1 base = rate[X] of currency X). Cached per day. */
export async function getRates(base: string): Promise<Record<string, number>> {
  const day = today();
  const cached = await prisma.exchangeRateCache.findUnique({
    where: { base_day: { base, day } },
  });
  if (cached) return JSON.parse(cached.ratesJson);

  try {
    const rates = await fetchRatesFromApi(base);
    await prisma.exchangeRateCache.upsert({
      where: { base_day: { base, day } },
      create: { base, day, ratesJson: JSON.stringify(rates) },
      update: { ratesJson: JSON.stringify(rates) },
    });
    return rates;
  } catch {
    // Offline or API down: fall back to the most recent cached day.
    const latest = await prisma.exchangeRateCache.findFirst({
      where: { base },
      orderBy: { day: "desc" },
    });
    if (latest) return JSON.parse(latest.ratesJson);
    throw new RatesUnavailableError(base);
  }
}

/**
 * Convert integer minor units between currencies using the base-currency
 * rate table. Exact identity when from === to (no API call, no rounding).
 */
export function convertMinor(
  amountMinor: number,
  from: string,
  to: string,
  ratesForTo: Record<string, number>
): number {
  if (from === to) return amountMinor;
  const rate = ratesForTo[from];
  if (!rate || rate <= 0) {
    throw new Error(`No exchange rate available for ${from} → ${to}`);
  }
  const major = amountMinor / minorFactor(from);
  return Math.round((major / rate) * minorFactor(to));
}

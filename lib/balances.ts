import "server-only";
import { prisma } from "./prisma";
import { getRates, convertMinor, RatesUnavailableError } from "./rates";
import {
  computeBalances,
  simplifyDebts,
  type BalanceSummary,
  type Transfer,
} from "./settlement";

// Assembles everything a trip page needs: raw entries with base-currency
// conversions attached, per-member balances, and the settlement plan.

export interface TripFinances {
  summary: BalanceSummary | null;
  transfers: Transfer[];
  /** expense/contribution id → amount converted to base currency (minor units) */
  convertedMinor: Map<string, number>;
  /** true when a needed exchange rate could not be fetched or cached */
  ratesUnavailable: boolean;
}

export type TripLedger = NonNullable<Awaited<ReturnType<typeof loadTripLedger>>>;
type TripWithLedger = TripLedger;

export async function loadTripLedger(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      expenses: {
        include: { splits: { include: { user: true } }, payer: true, createdBy: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      },
      contributions: { include: { user: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });
}

export async function computeTripFinances(trip: TripWithLedger): Promise<TripFinances> {
  const base = trip.baseCurrency;
  const currenciesUsed = new Set<string>();
  for (const e of trip.expenses) currenciesUsed.add(e.currency);
  for (const c of trip.contributions) currenciesUsed.add(c.currency);
  currenciesUsed.delete(base);

  let rates: Record<string, number> = {};
  if (currenciesUsed.size > 0) {
    try {
      rates = await getRates(base);
    } catch (err) {
      if (err instanceof RatesUnavailableError) {
        return {
          summary: null,
          transfers: [],
          convertedMinor: new Map(),
          ratesUnavailable: true,
        };
      }
      throw err;
    }
  }

  const convertedMinor = new Map<string, number>();
  for (const e of trip.expenses) {
    convertedMinor.set(e.id, convertMinor(e.amountMinor, e.currency, base, rates));
  }
  for (const c of trip.contributions) {
    convertedMinor.set(c.id, convertMinor(c.amountMinor, c.currency, base, rates));
  }

  const summary = computeBalances(
    trip.members.map((m) => m.userId),
    trip.expenses.map((e) => ({
      amountBaseMinor: convertedMinor.get(e.id)!,
      paidFromFund: e.paidFromFund,
      payerId: e.payerId,
      splits: e.splits.map((s) => ({ userId: s.userId, weight: s.weight })),
    })),
    trip.contributions.map((c) => ({
      userId: c.userId,
      amountBaseMinor: convertedMinor.get(c.id)!,
    }))
  );

  return {
    summary,
    transfers: simplifyDebts(summary),
    convertedMinor,
    ratesUnavailable: false,
  };
}

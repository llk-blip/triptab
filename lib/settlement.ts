// Pure settlement math. No database, no framework — fully unit-testable.
//
// Model
// -----
// Every amount here is already converted to the trip's base currency,
// in integer minor units (cents).
//
// A member's net balance:
//   net = (personal expenses they paid) + (their fund contributions)
//         − (their weighted share of ALL expenses, personal- and fund-paid)
//
// The common fund is treated as a virtual party:
//   fundNet = (spent from fund) − (total contributed)
// so that all nets (members + fund) sum to exactly zero. A negative fundNet
// means leftover pool money that is owed back to the group; a positive one
// means the pool was overdrawn and members owe into it.

export const FUND_ID = "__fund__";

export interface SplitInput {
  userId: string;
  weight: number;
}

export interface ExpenseInput {
  amountBaseMinor: number;
  paidFromFund: boolean;
  payerId: string | null; // null iff paidFromFund
  splits: SplitInput[];
}

export interface ContributionInput {
  userId: string;
  amountBaseMinor: number;
}

export interface MemberBalance {
  userId: string;
  paidPersonalMinor: number; // personal expenses they fronted
  contributedMinor: number; // paid into the common fund
  shareMinor: number; // their fair share of all expenses
  netMinor: number; // positive = is owed money, negative = owes
}

export interface BalanceSummary {
  members: MemberBalance[];
  fundContributedMinor: number;
  fundSpentMinor: number;
  fundBalanceMinor: number; // contributed − spent (can be negative if overdrawn)
  totalSpentMinor: number; // all expenses
}

export interface Transfer {
  fromId: string; // may be FUND_ID
  toId: string; // may be FUND_ID
  amountMinor: number;
}

/**
 * Split an integer amount by weights so the parts sum exactly to the total
 * (largest-remainder method). E.g. 100 split [1,1,1] → [34, 33, 33].
 */
export function allocateByWeights(totalMinor: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) throw new Error("Split weights must sum to a positive number");

  const exact = weights.map((w) => (totalMinor * w) / totalWeight);
  const floors = exact.map(Math.floor);
  let remainder = totalMinor - floors.reduce((a, b) => a + b, 0);

  // Hand out the leftover cents to the largest fractional parts first.
  const order = exact
    .map((v, i) => ({ frac: v - Math.floor(v), i }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floors];
  for (const { i } of order) {
    if (remainder <= 0) break;
    result[i] += 1;
    remainder -= 1;
  }
  return result;
}

export function computeBalances(
  memberIds: string[],
  expenses: ExpenseInput[],
  contributions: ContributionInput[]
): BalanceSummary {
  const paid = new Map<string, number>();
  const contributed = new Map<string, number>();
  const share = new Map<string, number>();
  for (const id of memberIds) {
    paid.set(id, 0);
    contributed.set(id, 0);
    share.set(id, 0);
  }

  let fundSpent = 0;
  let totalSpent = 0;

  for (const e of expenses) {
    totalSpent += e.amountBaseMinor;
    if (e.paidFromFund) {
      fundSpent += e.amountBaseMinor;
    } else {
      if (!e.payerId) throw new Error("Personal expense must have a payer");
      paid.set(e.payerId, (paid.get(e.payerId) ?? 0) + e.amountBaseMinor);
    }
    const parts = allocateByWeights(
      e.amountBaseMinor,
      e.splits.map((s) => s.weight)
    );
    e.splits.forEach((s, i) => {
      share.set(s.userId, (share.get(s.userId) ?? 0) + parts[i]);
    });
  }

  let fundContributed = 0;
  for (const c of contributions) {
    fundContributed += c.amountBaseMinor;
    contributed.set(c.userId, (contributed.get(c.userId) ?? 0) + c.amountBaseMinor);
  }

  const members: MemberBalance[] = memberIds.map((id) => {
    const p = paid.get(id) ?? 0;
    const c = contributed.get(id) ?? 0;
    const s = share.get(id) ?? 0;
    return {
      userId: id,
      paidPersonalMinor: p,
      contributedMinor: c,
      shareMinor: s,
      netMinor: p + c - s,
    };
  });

  return {
    members,
    fundContributedMinor: fundContributed,
    fundSpentMinor: fundSpent,
    fundBalanceMinor: fundContributed - fundSpent,
    totalSpentMinor: totalSpent,
  };
}

/**
 * Greedy debt simplification: repeatedly settle the largest debtor against
 * the largest creditor. Produces at most (parties − 1) transfers, versus up
 * to n·(n−1)/2 for raw pairwise debts.
 *
 * The common fund participates as FUND_ID when its balance is non-zero:
 * leftover pool money shows up as refunds from the fund; an overdrawn pool
 * shows up as top-ups owed to it.
 */
export function simplifyDebts(summary: BalanceSummary): Transfer[] {
  const nets: { id: string; net: number }[] = summary.members.map((m) => ({
    id: m.userId,
    net: m.netMinor,
  }));
  const fundNet = summary.fundSpentMinor - summary.fundContributedMinor;
  if (fundNet !== 0) nets.push({ id: FUND_ID, net: fundNet });

  const total = nets.reduce((a, b) => a + b.net, 0);
  if (total !== 0) {
    // Should be impossible given integer allocation; guard against bugs.
    throw new Error(`Balances do not sum to zero (off by ${total})`);
  }

  const creditors = nets.filter((n) => n.net > 0).sort((a, b) => b.net - a.net);
  const debtors = nets
    .filter((n) => n.net < 0)
    .map((n) => ({ id: n.id, owes: -n.net }))
    .sort((a, b) => b.owes - a.owes);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].net, debtors[di].owes);
    if (amount > 0) {
      transfers.push({ fromId: debtors[di].id, toId: creditors[ci].id, amountMinor: amount });
    }
    creditors[ci].net -= amount;
    debtors[di].owes -= amount;
    if (creditors[ci].net === 0) ci++;
    if (debtors[di].owes === 0) di++;
  }
  return transfers;
}

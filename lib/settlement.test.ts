import { describe, expect, it } from "vitest";
import {
  allocateByWeights,
  computeBalances,
  simplifyDebts,
  FUND_ID,
  type ExpenseInput,
} from "./settlement";

const eq = (userIds: string[]) => userIds.map((userId) => ({ userId, weight: 1 }));

describe("allocateByWeights", () => {
  it("splits evenly when divisible", () => {
    expect(allocateByWeights(300, [1, 1, 1])).toEqual([100, 100, 100]);
  });

  it("distributes leftover cents so parts sum exactly to the total", () => {
    const parts = allocateByWeights(100, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
  });

  it("respects custom weights", () => {
    expect(allocateByWeights(400, [2, 1, 1])).toEqual([200, 100, 100]);
  });

  it("always sums to the total across many random cases", () => {
    for (let i = 0; i < 500; i++) {
      const n = 2 + Math.floor(Math.random() * 5);
      const weights = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 4));
      const total = 1 + Math.floor(Math.random() * 1_000_000);
      const parts = allocateByWeights(total, weights);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every((p) => p >= 0)).toBe(true);
    }
  });

  it("rejects non-positive total weight", () => {
    expect(() => allocateByWeights(100, [0, 0])).toThrow();
  });
});

describe("computeBalances", () => {
  it("handles a simple two-person split", () => {
    // Alice pays 100, split equally with Bob → Bob owes Alice 50.
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 100, paidFromFund: false, payerId: "alice", splits: eq(["alice", "bob"]) }],
      []
    );
    const alice = summary.members.find((m) => m.userId === "alice")!;
    const bob = summary.members.find((m) => m.userId === "bob")!;
    expect(alice.netMinor).toBe(50);
    expect(bob.netMinor).toBe(-50);
  });

  it("fund-paid expenses create no personal credit", () => {
    // Both contribute 50 to the fund; fund pays a 100 dinner split equally.
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 100, paidFromFund: true, payerId: null, splits: eq(["alice", "bob"]) }],
      [
        { userId: "alice", amountBaseMinor: 50 },
        { userId: "bob", amountBaseMinor: 50 },
      ]
    );
    for (const m of summary.members) expect(m.netMinor).toBe(0);
    expect(summary.fundBalanceMinor).toBe(0);
  });

  it("uneven fund contributions settle correctly", () => {
    // Alice puts 100 into the fund, Bob puts 0. Fund pays 100, split equally.
    // Bob effectively consumed 50 of Alice's money.
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 100, paidFromFund: true, payerId: null, splits: eq(["alice", "bob"]) }],
      [{ userId: "alice", amountBaseMinor: 100 }]
    );
    expect(summary.members.find((m) => m.userId === "alice")!.netMinor).toBe(50);
    expect(summary.members.find((m) => m.userId === "bob")!.netMinor).toBe(-50);
    expect(summary.fundBalanceMinor).toBe(0);
  });

  it("tracks leftover fund balance", () => {
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 60, paidFromFund: true, payerId: null, splits: eq(["alice", "bob"]) }],
      [
        { userId: "alice", amountBaseMinor: 100 },
        { userId: "bob", amountBaseMinor: 100 },
      ]
    );
    expect(summary.fundBalanceMinor).toBe(140);
    expect(summary.fundContributedMinor).toBe(200);
    expect(summary.fundSpentMinor).toBe(60);
  });

  it("supports weighted splits and expenses not shared by all", () => {
    // 90 hotel paid by Alice, split 2:1 between Alice and Bob only (Carol out).
    const summary = computeBalances(
      ["alice", "bob", "carol"],
      [
        {
          amountBaseMinor: 90,
          paidFromFund: false,
          payerId: "alice",
          splits: [
            { userId: "alice", weight: 2 },
            { userId: "bob", weight: 1 },
          ],
        },
      ],
      []
    );
    expect(summary.members.find((m) => m.userId === "alice")!.netMinor).toBe(30);
    expect(summary.members.find((m) => m.userId === "bob")!.netMinor).toBe(-30);
    expect(summary.members.find((m) => m.userId === "carol")!.netMinor).toBe(0);
  });

  it("a payer who is not in the split is owed the full amount", () => {
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 80, paidFromFund: false, payerId: "alice", splits: eq(["bob"]) }],
      []
    );
    expect(summary.members.find((m) => m.userId === "alice")!.netMinor).toBe(80);
    expect(summary.members.find((m) => m.userId === "bob")!.netMinor).toBe(-80);
  });
});

describe("simplifyDebts", () => {
  it("settles a simple debt", () => {
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 100, paidFromFund: false, payerId: "alice", splits: eq(["alice", "bob"]) }],
      []
    );
    expect(simplifyDebts(summary)).toEqual([{ fromId: "bob", toId: "alice", amountMinor: 50 }]);
  });

  it("collapses chains: A owes B, B owes C → A pays C directly", () => {
    // Bob pays 100 split Alice/Bob; Carol pays 100 split Bob/Carol.
    // Raw pairwise would be 2 transfers (Alice→Bob 50, Bob→Carol 50);
    // simplified is 1: Alice→Carol 50.
    const summary = computeBalances(
      ["alice", "bob", "carol"],
      [
        { amountBaseMinor: 100, paidFromFund: false, payerId: "bob", splits: eq(["alice", "bob"]) },
        { amountBaseMinor: 100, paidFromFund: false, payerId: "carol", splits: eq(["bob", "carol"]) },
      ],
      []
    );
    expect(simplifyDebts(summary)).toEqual([{ fromId: "alice", toId: "carol", amountMinor: 50 }]);
  });

  it("produces at most n−1 transfers", () => {
    const ids = ["a", "b", "c", "d", "e"];
    const expenses: ExpenseInput[] = ids.map((payer, i) => ({
      amountBaseMinor: (i + 1) * 137,
      paidFromFund: false,
      payerId: payer,
      splits: eq(ids),
    }));
    const summary = computeBalances(ids, expenses, []);
    const transfers = simplifyDebts(summary);
    expect(transfers.length).toBeLessThanOrEqual(ids.length - 1);
    // Applying the transfers must zero every balance.
    const net = new Map(summary.members.map((m) => [m.userId, m.netMinor]));
    for (const t of transfers) {
      net.set(t.fromId, (net.get(t.fromId) ?? 0) + t.amountMinor);
      net.set(t.toId, (net.get(t.toId) ?? 0) - t.amountMinor);
    }
    for (const [, v] of net) expect(v).toBe(0);
  });

  it("leftover fund money is refunded from the fund", () => {
    // Only Alice funded the pool; nothing was spent → fund owes Alice 100.
    const summary = computeBalances(
      ["alice", "bob"],
      [],
      [{ userId: "alice", amountBaseMinor: 100 }]
    );
    expect(simplifyDebts(summary)).toEqual([
      { fromId: FUND_ID, toId: "alice", amountMinor: 100 },
    ]);
  });

  it("an overdrawn fund is owed top-ups", () => {
    // Fund spent 100 with zero contributions → members owe the fund.
    const summary = computeBalances(
      ["alice", "bob"],
      [{ amountBaseMinor: 100, paidFromFund: true, payerId: null, splits: eq(["alice", "bob"]) }],
      []
    );
    const transfers = simplifyDebts(summary);
    expect(transfers).toHaveLength(2);
    for (const t of transfers) {
      expect(t.toId).toBe(FUND_ID);
      expect(t.amountMinor).toBe(50);
    }
  });

  it("returns nothing when everyone is settled", () => {
    const summary = computeBalances(["alice", "bob"], [], []);
    expect(simplifyDebts(summary)).toEqual([]);
  });

  it("random ledgers always settle to zero with ≤ n−1 transfers", () => {
    for (let round = 0; round < 200; round++) {
      const n = 2 + Math.floor(Math.random() * 6);
      const ids = Array.from({ length: n }, (_, i) => `u${i}`);
      const expenses: ExpenseInput[] = [];
      const contributions = [];
      for (let i = 0; i < 8; i++) {
        const fromFund = Math.random() < 0.3;
        const subset = ids.filter(() => Math.random() < 0.7);
        if (subset.length === 0) subset.push(ids[0]);
        expenses.push({
          amountBaseMinor: 1 + Math.floor(Math.random() * 100_000),
          paidFromFund: fromFund,
          payerId: fromFund ? null : ids[Math.floor(Math.random() * n)],
          splits: subset.map((userId) => ({
            userId,
            weight: 1 + Math.floor(Math.random() * 3),
          })),
        });
      }
      for (let i = 0; i < 3; i++) {
        contributions.push({
          userId: ids[Math.floor(Math.random() * n)],
          amountBaseMinor: Math.floor(Math.random() * 50_000),
        });
      }
      const summary = computeBalances(ids, expenses, contributions);
      const transfers = simplifyDebts(summary);
      expect(transfers.length).toBeLessThanOrEqual(n); // n−1 members + possible fund party

      const net = new Map<string, number>(summary.members.map((m) => [m.userId, m.netMinor]));
      net.set(FUND_ID, summary.fundSpentMinor - summary.fundContributedMinor);
      for (const t of transfers) {
        net.set(t.fromId, (net.get(t.fromId) ?? 0) + t.amountMinor);
        net.set(t.toId, (net.get(t.toId) ?? 0) - t.amountMinor);
      }
      for (const [, v] of net) expect(v).toBe(0);
    }
  });
});

import Link from "next/link";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import { formatMinor } from "@/lib/money";
import { categoryEmoji, tileBg } from "@/lib/fun";
import type { TripLedger, TripFinances } from "@/lib/balances";
import ExpenseFields from "./ExpenseFields";
import DeleteButton from "@/components/DeleteButton";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExpensesTab({
  trip,
  finances,
  currentUserId,
}: {
  trip: TripLedger;
  finances: TripFinances;
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <details className="group">
        <summary className="cursor-pointer bg-white border-2 border-dashed border-amber-500 rounded-2xl px-4 py-3.5 font-bold text-sm text-coral select-none hover:bg-cream list-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> Add an
          expense
        </summary>
        <form
          action={addExpense}
          className="mt-2 bg-white rounded-2xl border-2 border-peach px-4 py-4 space-y-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <ExpenseFields trip={trip} currentUserId={currentUserId} />
          <button className="w-full rounded-xl bg-coral text-white font-display font-bold py-2.5 text-sm hover:bg-[#e85d3d]">
            Save expense
          </button>
        </form>
      </details>

      {trip.expenses.length === 0 ? (
        <div className="text-center text-sm text-warmgray py-8">
          <div className="text-4xl mb-2">🐯</div>
          No expenses yet — add the first one above.
        </div>
      ) : (
        <ul className="space-y-2">
          {trip.expenses.map((e) => {
            const converted = finances.convertedMinor.get(e.id);
            const emoji = e.paidFromFund ? "💰" : categoryEmoji(e.description);
            const splitLabel = e.splits
              .map((s) => (s.weight > 1 ? `${s.user.name} ×${s.weight}` : s.user.name))
              .join(", ");
            return (
              <li key={e.id} className="tt-lift bg-white rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: tileBg(emoji) }}
                  >
                    {emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate">{e.description}</div>
                    <div className="text-xs text-warmgray mt-0.5">
                      {fmtDate(e.date)} ·{" "}
                      {e.paidFromFund ? (
                        <span className="inline-block rounded-full bg-peachlight text-coral px-2 py-0.5 font-bold">
                          🐯 Common fund
                        </span>
                      ) : (
                        <>
                          paid by <span className="font-bold text-ink">{e.payer?.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-extrabold">
                      {formatMinor(e.amountMinor, e.currency)}
                    </div>
                    {e.currency !== trip.baseCurrency && converted !== undefined && (
                      <div className="text-xs text-warmgray">
                        ≈ {formatMinor(converted, trip.baseCurrency)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-peach">
                  <span className="text-xs text-warmgray truncate">Split: {splitLabel}</span>
                  <span className="flex items-center gap-3 shrink-0 ml-3">
                    <Link
                      href={`/trips/${trip.id}/expenses/${e.id}/edit`}
                      className="text-xs text-inkmute font-semibold hover:text-ink underline underline-offset-2"
                    >
                      Edit
                    </Link>
                    <form action={deleteExpense}>
                      <input type="hidden" name="expenseId" value={e.id} />
                      <DeleteButton confirmText={`Delete "${e.description}"?`} />
                    </form>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

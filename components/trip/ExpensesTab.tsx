import Link from "next/link";
import { addExpense, deleteExpense } from "@/app/actions/expenses";
import { formatMinor } from "@/lib/money";
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
      <details className="bg-white rounded-xl border border-slate-200 group">
        <summary className="cursor-pointer px-4 py-3 font-medium text-sm text-emerald-700 select-none">
          + Add an expense
        </summary>
        <form action={addExpense} className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <input type="hidden" name="tripId" value={trip.id} />
          <ExpenseFields trip={trip} currentUserId={currentUserId} />
          <button className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700">
            Add expense
          </button>
        </form>
      </details>

      {trip.expenses.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">
          No expenses yet — add the first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {trip.expenses.map((e) => {
            const converted = finances.convertedMinor.get(e.id);
            const splitLabel = e.splits
              .map((s) => (s.weight > 1 ? `${s.user.name} ×${s.weight}` : s.user.name))
              .join(", ");
            return (
              <li key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtDate(e.date)} ·{" "}
                      {e.paidFromFund ? (
                        <span className="inline-block rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-medium">
                          🐷 Common fund
                        </span>
                      ) : (
                        <>paid by <span className="font-medium">{e.payer?.name}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{formatMinor(e.amountMinor, e.currency)}</div>
                    {e.currency !== trip.baseCurrency && converted !== undefined && (
                      <div className="text-xs text-slate-500">
                        ≈ {formatMinor(converted, trip.baseCurrency)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 truncate">Split: {splitLabel}</span>
                  <span className="flex items-center gap-3 shrink-0 ml-3">
                    <Link
                      href={`/trips/${trip.id}/expenses/${e.id}/edit`}
                      className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2"
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

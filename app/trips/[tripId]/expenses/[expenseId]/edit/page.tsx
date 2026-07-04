import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadTripLedger } from "@/lib/balances";
import { updateExpense } from "@/app/actions/expenses";
import { minorFactor, decimalsFor } from "@/lib/money";
import { FUND_ID } from "@/lib/settlement";
import ExpenseFields from "@/components/trip/ExpenseFields";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ tripId: string; expenseId: string }>;
}) {
  const { tripId, expenseId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trip = await loadTripLedger(tripId);
  if (!trip || !trip.members.some((m) => m.userId === user.id)) notFound();
  const expense = trip.expenses.find((e) => e.id === expenseId);
  if (!expense) notFound();

  const defaults = {
    description: expense.description,
    amount: (expense.amountMinor / minorFactor(expense.currency)).toFixed(
      decimalsFor(expense.currency)
    ),
    currency: expense.currency,
    date: expense.date.toISOString().slice(0, 10),
    payer: expense.paidFromFund ? FUND_ID : (expense.payerId ?? undefined),
    splits: new Map(expense.splits.map((s) => [s.userId, s.weight])),
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Edit expense</h1>
        <Link
          href={`/trips/${tripId}?tab=expenses`}
          className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2"
        >
          Back to trip
        </Link>
      </div>
      <form
        action={updateExpense}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
      >
        <input type="hidden" name="expenseId" value={expense.id} />
        <input type="hidden" name="tripId" value={tripId} />
        <ExpenseFields trip={trip} currentUserId={user.id} defaults={defaults} />
        <button className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700">
          Save changes
        </button>
      </form>
    </div>
  );
}

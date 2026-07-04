import { addContribution, deleteContribution } from "@/app/actions/contributions";
import { formatMinor, CURRENCIES } from "@/lib/money";
import type { TripLedger, TripFinances } from "@/lib/balances";
import DeleteButton from "@/components/DeleteButton";

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function FundTab({
  trip,
  finances,
  currentUserId,
}: {
  trip: TripLedger;
  finances: TripFinances;
  currentUserId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const s = finances.summary;
  const fundExpenses = trip.expenses.filter((e) => e.paidFromFund);
  const currencyOrder = [
    ...CURRENCIES.filter((c) => c.code === trip.baseCurrency || c.code === trip.destCurrency),
    ...CURRENCIES.filter((c) => c.code !== trip.baseCurrency && c.code !== trip.destCurrency),
  ];

  return (
    <div className="space-y-4">
      {s && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500">Contributed</div>
            <div className="font-semibold text-sm mt-1">
              {formatMinor(s.fundContributedMinor, trip.baseCurrency)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <div className="text-xs text-slate-500">Spent from fund</div>
            <div className="font-semibold text-sm mt-1">
              {formatMinor(s.fundSpentMinor, trip.baseCurrency)}
            </div>
          </div>
          <div
            className={`rounded-xl border p-3 text-center ${
              s.fundBalanceMinor < 0
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className="text-xs text-slate-600">Fund balance</div>
            <div
              className={`font-semibold text-sm mt-1 ${
                s.fundBalanceMinor < 0 ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {formatMinor(s.fundBalanceMinor, trip.baseCurrency)}
            </div>
          </div>
        </div>
      )}

      <details className="bg-white rounded-xl border border-slate-200">
        <summary className="cursor-pointer px-4 py-3 font-medium text-sm text-emerald-700 select-none">
          + Log a contribution to the fund
        </summary>
        <form
          action={addContribution}
          className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Who contributed</span>
            <select name="contributorId" defaultValue={currentUserId} className={inputCls}>
              {trip.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Amount</span>
              <input
                name="amount"
                required
                inputMode="decimal"
                pattern="[0-9.,\s]+"
                placeholder="0.00"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Currency</span>
              <select name="currency" defaultValue={trip.baseCurrency} className={inputCls}>
                {currencyOrder.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date</span>
              <input name="date" type="date" required defaultValue={today} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Note (optional)</span>
              <input name="note" placeholder="cash at airport" className={inputCls} />
            </label>
          </div>
          <button className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700">
            Log contribution
          </button>
        </form>
      </details>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Contributions</h3>
        {trip.contributions.length === 0 ? (
          <p className="text-sm text-slate-500">Nobody has put money into the fund yet.</p>
        ) : (
          <ul className="space-y-2">
            {trip.contributions.map((c) => {
              const converted = finances.convertedMinor.get(c.id);
              return (
                <li
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{c.user.name}</div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(c.date)}
                      {c.note ? ` · ${c.note}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatMinor(c.amountMinor, c.currency)}
                      </div>
                      {c.currency !== trip.baseCurrency && converted !== undefined && (
                        <div className="text-xs text-slate-500">
                          ≈ {formatMinor(converted, trip.baseCurrency)}
                        </div>
                      )}
                    </div>
                    <form action={deleteContribution}>
                      <input type="hidden" name="contributionId" value={c.id} />
                      <DeleteButton
                        confirmText={`Delete ${c.user.name}'s contribution of ${formatMinor(c.amountMinor, c.currency)}?`}
                      />
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {fundExpenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Paid from the fund</h3>
          <ul className="space-y-1.5">
            {fundExpenses.map((e) => (
              <li
                key={e.id}
                className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center justify-between text-sm"
              >
                <span className="truncate">
                  {e.description}
                  <span className="text-xs text-slate-400 ml-2">{fmtDate(e.date)}</span>
                </span>
                <span className="font-medium shrink-0 ml-3">
                  {formatMinor(e.amountMinor, e.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Fund-paid expenses are managed in the Expenses tab.
          </p>
        </div>
      )}
    </div>
  );
}

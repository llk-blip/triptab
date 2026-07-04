import { addContribution, deleteContribution } from "@/app/actions/contributions";
import { formatMinor, CURRENCIES } from "@/lib/money";
import { avatarColor, initials } from "@/lib/fun";
import type { TripLedger, TripFinances } from "@/lib/balances";
import DeleteButton from "@/components/DeleteButton";

const inputCls =
  "mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm bg-white focus:outline-none focus:border-sunny";

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
  const memberIndex = new Map(trip.members.map((m, i) => [m.userId, i]));
  const currencyOrder = [
    ...CURRENCIES.filter((c) => c.code === trip.baseCurrency || c.code === trip.destCurrency),
    ...CURRENCIES.filter((c) => c.code !== trip.baseCurrency && c.code !== trip.destCurrency),
  ];

  return (
    <div className="space-y-4">
      {s && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3.5 text-center">
            <div className="text-[11px] text-warmgray font-semibold">Contributed</div>
            <div className="font-display font-extrabold text-lg mt-0.5">
              {formatMinor(s.fundContributedMinor, trip.baseCurrency)}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3.5 text-center">
            <div className="text-[11px] text-warmgray font-semibold">Spent from fund</div>
            <div className="font-display font-extrabold text-lg mt-0.5">
              {formatMinor(s.fundSpentMinor, trip.baseCurrency)}
            </div>
          </div>
          <div
            className={`rounded-2xl border-2 p-3.5 text-center ${
              s.fundBalanceMinor < 0 ? "bg-peachlight border-coral" : "bg-peachlight border-amber-500"
            }`}
          >
            <div className="text-[11px] text-warmgray font-semibold">Fund balance</div>
            <div className="font-display font-extrabold text-lg mt-0.5 text-coral">
              {formatMinor(s.fundBalanceMinor, trip.baseCurrency)}
            </div>
          </div>
        </div>
      )}

      <details className="group">
        <summary className="cursor-pointer bg-white border-2 border-dashed border-amber-500 rounded-2xl px-4 py-3.5 font-bold text-sm text-coral select-none hover:bg-cream list-none">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> Log a
          contribution to the fund
        </summary>
        <form
          action={addContribution}
          className="mt-2 bg-white rounded-2xl border-2 border-peach px-4 py-4 space-y-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <label className="block">
            <span className="text-sm font-semibold text-ink">Who contributed</span>
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
              <span className="text-sm font-semibold text-ink">Amount</span>
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
              <span className="text-sm font-semibold text-ink">Currency</span>
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
              <span className="text-sm font-semibold text-ink">Date</span>
              <input name="date" type="date" required defaultValue={today} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Note (optional)</span>
              <input name="note" placeholder="cash at airport" className={inputCls} />
            </label>
          </div>
          <button className="w-full rounded-xl bg-coral text-white font-display font-bold py-2.5 text-sm hover:bg-[#e85d3d]">
            Log contribution
          </button>
        </form>
      </details>

      <div>
        <h3 className="font-display text-base font-bold mb-2">Contributions</h3>
        {trip.contributions.length === 0 ? (
          <p className="text-sm text-warmgray">Nobody has put money into the fund yet. 🐯</p>
        ) : (
          <ul className="space-y-2">
            {trip.contributions.map((c) => {
              const converted = finances.convertedMinor.get(c.id);
              return (
                <li
                  key={c.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ backgroundColor: avatarColor(memberIndex.get(c.userId) ?? 0) }}
                  >
                    {initials(c.user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{c.user.name}</div>
                    <div className="text-xs text-warmgray">
                      {fmtDate(c.date)}
                      {c.note ? ` · ${c.note}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-display font-extrabold text-sm">
                        {formatMinor(c.amountMinor, c.currency)}
                      </div>
                      {c.currency !== trip.baseCurrency && converted !== undefined && (
                        <div className="text-xs text-warmgray">
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
          <h3 className="font-display text-base font-bold mb-2">Paid from the fund</h3>
          <ul className="space-y-1.5">
            {fundExpenses.map((e) => (
              <li
                key={e.id}
                className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between text-sm"
              >
                <span className="truncate">
                  {e.description}
                  <span className="text-xs text-warmgray ml-2">{fmtDate(e.date)}</span>
                </span>
                <span className="font-bold shrink-0 ml-3">
                  {formatMinor(e.amountMinor, e.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-warmgray mt-2">
            Fund-paid expenses are managed in the Expenses tab.
          </p>
        </div>
      )}
    </div>
  );
}

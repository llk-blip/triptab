import { CURRENCIES } from "@/lib/money";
import { FUND_ID } from "@/lib/settlement";
import type { TripLedger } from "@/lib/balances";

// Shared form fields for adding and editing an expense (server component —
// plain HTML inputs, validated in the server action).

export interface ExpenseDefaults {
  description?: string;
  amount?: string;
  currency?: string;
  date?: string;
  payer?: string; // userId or FUND_ID
  splits?: Map<string, number>; // userId → weight; undefined = all members, weight 1
}

const inputCls =
  "mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm bg-white focus:outline-none focus:border-sunny";

export default function ExpenseFields({
  trip,
  currentUserId,
  defaults = {},
}: {
  trip: TripLedger;
  currentUserId: string;
  defaults?: ExpenseDefaults;
}) {
  const today = new Date().toISOString().slice(0, 10);
  // Destination and home currencies first — the two you'll actually use.
  const currencyOrder = [
    ...CURRENCIES.filter((c) => c.code === trip.destCurrency || c.code === trip.baseCurrency),
    ...CURRENCIES.filter((c) => c.code !== trip.destCurrency && c.code !== trip.baseCurrency),
  ];

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-semibold text-ink">Description</span>
        <input
          name="description"
          required
          defaultValue={defaults.description}
          placeholder="Ramen dinner"
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Amount</span>
          <input
            name="amount"
            required
            inputMode="decimal"
            pattern="[0-9.,\s]+"
            defaultValue={defaults.amount}
            placeholder="0.00"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Currency</span>
          <select
            name="currency"
            defaultValue={defaults.currency ?? trip.destCurrency}
            className={inputCls}
          >
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
          <input
            name="date"
            type="date"
            required
            defaultValue={defaults.date ?? today}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Paid by</span>
          <select name="payer" defaultValue={defaults.payer ?? currentUserId} className={inputCls}>
            {trip.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name}
              </option>
            ))}
            <option value={FUND_ID}>🐯 Common fund</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Split among</legend>
        <p className="text-xs text-warmgray mb-2">
          Weights set uneven shares — e.g. 2 for a couple counted as two people.
        </p>
        <div className="space-y-1.5">
          {trip.members.map((m) => {
            const included = defaults.splits ? defaults.splits.has(m.userId) : true;
            const weight = defaults.splits?.get(m.userId) ?? 1;
            return (
              <div
                key={m.userId}
                className="flex items-center justify-between rounded-xl border-2 border-peach px-3 py-1.5"
              >
                <label className="flex items-center gap-2 text-sm font-medium flex-1">
                  <input
                    type="checkbox"
                    name={`split_${m.userId}`}
                    defaultChecked={included}
                    className="accent-coral h-4 w-4"
                  />
                  {m.user.name}
                </label>
                <label className="flex items-center gap-1 text-xs text-warmgray">
                  weight
                  <input
                    type="number"
                    name={`weight_${m.userId}`}
                    min={1}
                    step={1}
                    defaultValue={weight}
                    className="w-14 rounded-lg border-2 border-peach px-1.5 py-1 text-sm text-right"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

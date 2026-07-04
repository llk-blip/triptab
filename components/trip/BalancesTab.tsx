import { formatMinor } from "@/lib/money";
import { FUND_ID } from "@/lib/settlement";
import type { TripLedger, TripFinances } from "@/lib/balances";

export default function BalancesTab({
  trip,
  finances,
}: {
  trip: TripLedger;
  finances: TripFinances;
}) {
  const s = finances.summary;
  if (!s) return null;
  const base = trip.baseCurrency;
  const nameOf = (id: string) =>
    id === FUND_ID ? "🐷 Common fund" : trip.members.find((m) => m.userId === id)?.user.name ?? "?";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">How to settle up</h3>
        {finances.transfers.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
            ✨ Everyone is square — nothing to settle.
          </div>
        ) : (
          <ul className="space-y-2">
            {finances.transfers.map((t, i) => (
              <li
                key={i}
                className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between text-sm"
              >
                <span>
                  <span className="font-medium">{nameOf(t.fromId)}</span>
                  <span className="text-slate-400 mx-2">pays</span>
                  <span className="font-medium">{nameOf(t.toId)}</span>
                </span>
                <span className="font-semibold">{formatMinor(t.amountMinor, base)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Minimum number of transfers to settle everything, in {base}.
          {finances.transfers.some((t) => t.fromId === FUND_ID) &&
            " Payments from the common fund are refunds of leftover pool money."}
          {finances.transfers.some((t) => t.toId === FUND_ID) &&
            " Payments to the common fund top up an overdrawn pool."}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Per-person breakdown</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="text-left font-medium px-4 py-2.5">Traveller</th>
                <th className="text-right font-medium px-3 py-2.5">Paid</th>
                <th className="text-right font-medium px-3 py-2.5">To fund</th>
                <th className="text-right font-medium px-3 py-2.5">Fair share</th>
                <th className="text-right font-medium px-4 py-2.5">Net</th>
              </tr>
            </thead>
            <tbody>
              {s.members.map((m) => {
                const name = nameOf(m.userId);
                return (
                  <tr key={m.userId} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium whitespace-nowrap">{name}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {formatMinor(m.paidPersonalMinor, base)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {formatMinor(m.contributedMinor, base)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {formatMinor(m.shareMinor, base)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap ${
                        m.netMinor > 0
                          ? "text-emerald-700"
                          : m.netMinor < 0
                            ? "text-red-600"
                            : "text-slate-500"
                      }`}
                    >
                      {m.netMinor > 0 ? "+" : ""}
                      {formatMinor(m.netMinor, base)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Net = paid + fund contributions − fair share of all expenses. Positive means the group
          owes them money.
        </p>
      </div>
    </div>
  );
}

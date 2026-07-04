import { formatMinor } from "@/lib/money";
import { FUND_ID } from "@/lib/settlement";
import { avatarColor, initials } from "@/lib/fun";
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
  const memberIndex = new Map(trip.members.map((m, i) => [m.userId, i]));
  const nameOf = (id: string) =>
    id === FUND_ID ? "Common fund" : (trip.members.find((m) => m.userId === id)?.user.name ?? "?");

  const Avatar = ({ id }: { id: string }) =>
    id === FUND_ID ? (
      <span className="w-7 h-7 rounded-full bg-peachlight border border-amber-500 flex items-center justify-center text-sm shrink-0">
        🐯
      </span>
    ) : (
      <span
        className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[11px] shrink-0"
        style={{ backgroundColor: avatarColor(memberIndex.get(id) ?? 0) }}
      >
        {initials(nameOf(id))}
      </span>
    );

  return (
    <div className="space-y-5">
      <div>
        <div className="bg-peachlight border-2 border-amber-500 rounded-2xl p-4">
          <div className="font-display font-bold text-sm mb-2">✨ How to settle up</div>
          {finances.transfers.length === 0 ? (
            <div className="bg-white rounded-xl px-4 py-3 text-sm font-semibold text-leaf">
              🎉 Everyone is square — nothing to settle.
            </div>
          ) : (
            <ul className="space-y-2">
              {finances.transfers.map((t, i) => (
                <li
                  key={i}
                  className="bg-white rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm"
                >
                  <Avatar id={t.fromId} />
                  <span className="font-semibold">{nameOf(t.fromId)}</span>
                  <span className="text-coral font-bold">→</span>
                  <Avatar id={t.toId} />
                  <span className="font-semibold">{nameOf(t.toId)}</span>
                  <span className="ml-auto font-display font-extrabold">
                    {formatMinor(t.amountMinor, base)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-warmgray mt-2">
          Minimum number of transfers to settle everything, in {base}.
          {finances.transfers.some((t) => t.fromId === FUND_ID) &&
            " Payments from the common fund are refunds of leftover pool money."}
          {finances.transfers.some((t) => t.toId === FUND_ID) &&
            " Payments to the common fund top up an overdrawn pool."}
        </p>
      </div>

      <div>
        <h3 className="font-display text-base font-bold mb-2">Per-person breakdown</h3>
        <div className="bg-white rounded-2xl border-2 border-peach overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-warmgray border-b-2 border-peach">
                <th className="text-left font-semibold px-4 py-2.5">Traveller</th>
                <th className="text-right font-semibold px-3 py-2.5">Paid</th>
                <th className="text-right font-semibold px-3 py-2.5">To fund</th>
                <th className="text-right font-semibold px-3 py-2.5">Fair share</th>
                <th className="text-right font-semibold px-4 py-2.5">Net</th>
              </tr>
            </thead>
            <tbody>
              {s.members.map((m) => (
                <tr key={m.userId} className="border-b border-peach last:border-0">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-2 font-bold">
                      <Avatar id={m.userId} />
                      {nameOf(m.userId)}
                    </span>
                  </td>
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
                    className={`px-4 py-2.5 text-right whitespace-nowrap font-display font-extrabold ${
                      m.netMinor > 0 ? "text-leaf" : m.netMinor < 0 ? "text-coral" : "text-warmgray"
                    }`}
                  >
                    {m.netMinor > 0 ? "+" : ""}
                    {formatMinor(m.netMinor, base)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-warmgray mt-2">
          Net = paid + fund contributions − fair share of all expenses. Positive means the group
          owes them money.
        </p>
      </div>
    </div>
  );
}

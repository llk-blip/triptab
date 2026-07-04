import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createTrip } from "@/app/actions/trips";
import { CURRENCIES } from "@/lib/money";

function CurrencySelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm bg-white focus:outline-none focus:border-sunny"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}

export default async function NewTripPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-extrabold mb-4">New trip ✈️</h1>
      <form
        action={createTrip}
        className="bg-white rounded-3xl border-2 border-peach p-6 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-semibold text-ink">Trip name</span>
          <input
            name="name"
            required
            placeholder="Tokyo 2026"
            className="mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm focus:outline-none focus:border-sunny"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Home currency</span>
          <span className="block text-xs text-warmgray">
            Balances and settlements are shown in this currency.
          </span>
          <CurrencySelect name="baseCurrency" defaultValue="SGD" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Destination currency</span>
          <span className="block text-xs text-warmgray">
            Offered as a quick pick when logging expenses.
          </span>
          <CurrencySelect name="destCurrency" defaultValue="JPY" />
        </label>
        <button className="w-full rounded-xl bg-coral text-white font-display font-bold py-2.5 text-sm hover:bg-[#e85d3d]">
          Create trip
        </button>
      </form>
    </div>
  );
}

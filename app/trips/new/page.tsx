import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createTrip } from "@/app/actions/trips";
import { CURRENCIES } from "@/lib/money";

function CurrencySelect({ name, defaultValue }: { name: string; defaultValue: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
      <h1 className="text-xl font-semibold mb-4">New trip</h1>
      <form
        action={createTrip}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Trip name</span>
          <input
            name="name"
            required
            placeholder="Tokyo 2026"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Home currency</span>
          <span className="block text-xs text-slate-500">
            Balances and settlements are shown in this currency.
          </span>
          <CurrencySelect name="baseCurrency" defaultValue="SGD" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Destination currency</span>
          <span className="block text-xs text-slate-500">
            Offered as a quick pick when logging expenses.
          </span>
          <CurrencySelect name="destCurrency" defaultValue="JPY" />
        </label>
        <button className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700">
          Create trip
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { loadTripLedger, computeTripFinances } from "@/lib/balances";
import { formatMinor } from "@/lib/money";
import CopyButton from "@/components/CopyButton";
import ExpensesTab from "@/components/trip/ExpensesTab";
import FundTab from "@/components/trip/FundTab";
import BalancesTab from "@/components/trip/BalancesTab";
import ActivityTab from "@/components/trip/ActivityTab";

const TABS = [
  { id: "expenses", label: "Expenses" },
  { id: "fund", label: "Fund" },
  { id: "balances", label: "Balances" },
  { id: "activity", label: "Activity" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const { tripId } = await params;
  const { tab: rawTab, error } = await searchParams;
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "expenses";

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const trip = await loadTripLedger(tripId);
  if (!trip) notFound();
  if (!trip.members.some((m) => m.userId === user.id)) {
    return (
      <div className="mx-auto max-w-md mt-10 bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-600">
        You&apos;re not a member of this trip. Ask a member for the invite link.
      </div>
    );
  }

  const finances = await computeTripFinances(trip);

  // Behind a proxy (Railway), `host` is the internal address; the public
  // domain arrives in x-forwarded-host.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const inviteUrl = `${proto}://${host}/join/${trip.inviteToken}`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">{trip.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Home {trip.baseCurrency} · Destination {trip.destCurrency} ·{" "}
            {trip.members.map((m) => m.user.name).join(", ")}
          </p>
        </div>
        <CopyButton text={inviteUrl} label="Copy invite link" />
      </div>

      {finances.summary && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Total trip spend</div>
            <div className="font-semibold mt-0.5">
              {formatMinor(finances.summary.totalSpentMinor, trip.baseCurrency)}
            </div>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              finances.summary.fundBalanceMinor < 0
                ? "bg-red-50 border-red-200"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className="text-xs text-slate-600">🐷 Common fund balance</div>
            <div
              className={`font-semibold mt-0.5 ${
                finances.summary.fundBalanceMinor < 0 ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {formatMinor(finances.summary.fundBalanceMinor, trip.baseCurrency)}
            </div>
          </div>
        </div>
      )}

      {finances.ratesUnavailable && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          ⚠️ Live exchange rates are unavailable right now (no internet connection?). Original
          amounts are shown, but converted totals and balances will appear once rates can be
          fetched.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <nav className="flex gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/trips/${trip.id}?tab=${t.id}`}
            className={`flex-1 text-center text-sm font-medium rounded-lg py-2 ${
              tab === t.id
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "expenses" && (
        <ExpensesTab trip={trip} finances={finances} currentUserId={user.id} />
      )}
      {tab === "fund" && <FundTab trip={trip} finances={finances} currentUserId={user.id} />}
      {tab === "balances" &&
        (finances.summary ? (
          <BalancesTab trip={trip} finances={finances} />
        ) : (
          <p className="text-center text-sm text-slate-500 py-8">
            Balances need exchange rates — reconnect to the internet and refresh.
          </p>
        ))}
      {tab === "activity" && <ActivityTab tripId={trip.id} />}
    </div>
  );
}

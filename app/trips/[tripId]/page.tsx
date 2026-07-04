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
  { id: "expenses", label: "Expenses", icon: "🧾" },
  { id: "fund", label: "Fund", icon: "💰" },
  { id: "balances", label: "Balances", icon: "⚖️" },
  { id: "activity", label: "Activity", icon: "📜" },
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
      <div className="mx-auto max-w-md mt-10 bg-white rounded-3xl border-2 border-peach p-6 text-center text-sm text-inkmute">
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
          <h1 className="font-display text-3xl font-extrabold">{trip.name}</h1>
          <p className="text-sm text-warmgray mt-0.5">
            Home {trip.baseCurrency} · Destination {trip.destCurrency} ·{" "}
            {trip.members.map((m) => m.user.name).join(", ")}
          </p>
        </div>
        <CopyButton text={inviteUrl} label="Copy invite link" />
      </div>

      {finances.summary && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl border-2 border-peach p-4">
            <div className="text-xs text-warmgray font-semibold">Total trip spend</div>
            <div className="font-display text-2xl font-extrabold mt-0.5">
              {formatMinor(finances.summary.totalSpentMinor, trip.baseCurrency)}
            </div>
          </div>
          <div
            className={`rounded-2xl border-2 p-4 ${
              finances.summary.fundBalanceMinor < 0
                ? "bg-peachlight border-coral"
                : "bg-gradient-to-br from-peachlight to-cream border-amber-500"
            }`}
          >
            <div className="text-xs text-warmgray font-semibold flex items-center gap-1.5">
              <span className="text-xl tt-float inline-block">🐯</span>Common fund balance
            </div>
            <div
              className={`font-display text-2xl font-extrabold mt-0.5 ${
                finances.summary.fundBalanceMinor < 0 ? "text-coral" : "text-coral"
              }`}
            >
              {formatMinor(finances.summary.fundBalanceMinor, trip.baseCurrency)}
            </div>
          </div>
        </div>
      )}

      {finances.ratesUnavailable && (
        <div className="mb-4 rounded-2xl bg-peachlight border-2 border-amber-500 px-4 py-3 text-sm text-ink">
          ⚠️ Live exchange rates are unavailable right now (no internet connection?). Original
          amounts are shown, but converted totals and balances will appear once rates can be
          fetched.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-peachlight border-2 border-coral px-4 py-3 text-sm text-coral font-semibold">
          {error}
        </div>
      )}

      <nav className="flex gap-1.5 mb-4 bg-white rounded-2xl border-2 border-peach p-1.5">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/trips/${trip.id}?tab=${t.id}`}
            className={`flex-1 text-center text-sm font-bold rounded-xl py-2 ${
              tab === t.id ? "bg-coral text-white" : "text-inkmute hover:bg-cream"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden text-xs">{t.label}</span>
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
          <p className="text-center text-sm text-warmgray py-8">
            Balances need exchange rates — reconnect to the internet and refresh.
          </p>
        ))}
      {tab === "activity" && <ActivityTab tripId={trip.id} />}
    </div>
  );
}

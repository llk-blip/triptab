import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await prisma.tripMember.findMany({
    where: { userId: user.id },
    include: {
      trip: {
        include: { _count: { select: { members: true, expenses: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Your trips</h1>
        <Link
          href="/trips/new"
          className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
        >
          + New trip
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="mb-2">No trips yet.</p>
          <p className="text-sm">
            Create one, or ask a friend for their trip&apos;s invite link.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {memberships.map(({ trip }) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-400 transition-colors"
              >
                <div className="font-medium">{trip.name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {trip.baseCurrency} · {trip.destCurrency} · {trip._count.members}{" "}
                  {trip._count.members === 1 ? "traveller" : "travellers"} ·{" "}
                  {trip._count.expenses} expenses
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

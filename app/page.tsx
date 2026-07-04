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
        <h1 className="font-display text-2xl font-extrabold">Your trips</h1>
        <Link
          href="/trips/new"
          className="tt-chunky rounded-[14px] bg-sunny text-ink text-sm font-bold px-4 py-2"
        >
          + New trip
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-peach p-8 text-center text-warmgray">
          <div className="text-4xl mb-2">🐯</div>
          <p className="mb-2 font-semibold text-ink">No trips yet.</p>
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
                className="tt-lift block bg-white rounded-2xl border-2 border-peach p-4"
              >
                <div className="font-display font-bold text-lg">{trip.name}</div>
                <div className="text-sm text-warmgray mt-1">
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

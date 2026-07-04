import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { joinTrip } from "@/app/actions/trips";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trip = await prisma.trip.findUnique({
    where: { inviteToken: token },
    include: { members: { include: { user: true } } },
  });

  if (!trip) {
    return (
      <div className="mx-auto max-w-md mt-10 bg-white rounded-xl border border-slate-200 p-6 text-center">
        <p className="font-medium">This invite link isn&apos;t valid.</p>
        <p className="text-sm text-slate-500 mt-1">Ask your friend to send it again.</p>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (user && trip.members.some((m) => m.userId === user.id)) {
    redirect(`/trips/${trip.id}`);
  }

  return (
    <div className="mx-auto max-w-md mt-10 bg-white rounded-xl border border-slate-200 p-6 text-center">
      <p className="text-sm text-slate-500">You&apos;re invited to join</p>
      <h1 className="text-xl font-semibold mt-1">{trip.name}</h1>
      <p className="text-sm text-slate-500 mt-2">
        {trip.members.length} {trip.members.length === 1 ? "traveller" : "travellers"} so far:{" "}
        {trip.members.map((m) => m.user.name).join(", ")}
      </p>

      {user ? (
        <form action={joinTrip} className="mt-5">
          <input type="hidden" name="token" value={token} />
          <button className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700">
            Join as {user.name}
          </button>
        </form>
      ) : (
        <div className="mt-5 space-y-2">
          <Link
            href={`/signup?invite=${token}`}
            className="block w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700"
          >
            Create an account & join
          </Link>
          <Link
            href={`/login?invite=${token}`}
            className="block w-full rounded-lg border border-slate-300 font-medium py-2 text-sm hover:bg-slate-50"
          >
            I already have an account
          </Link>
        </div>
      )}
    </div>
  );
}

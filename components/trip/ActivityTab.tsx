import { prisma } from "@/lib/prisma";

const ICONS: Record<string, string> = {
  created: "➕",
  updated: "✏️",
  deleted: "🗑️",
  joined: "👋",
};

export default async function ActivityTab({ tripId }: { tripId: string }) {
  const entries = await prisma.activityLog.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (entries.length === 0) {
    return <p className="text-center text-sm text-slate-500 py-8">No activity yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {entries.map((e) => (
        <li
          key={e.id}
          className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 text-sm flex items-start gap-2.5"
        >
          <span className="shrink-0">{ICONS[e.action] ?? "•"}</span>
          <span className="min-w-0">
            <span>{e.summary}</span>
            <span className="block text-xs text-slate-400 mt-0.5">
              {e.createdAt.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

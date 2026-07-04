import { prisma } from "@/lib/prisma";
import { tileBg } from "@/lib/fun";

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
    return (
      <div className="text-center text-sm text-warmgray py-8">
        <div className="text-4xl mb-2">📜</div>
        No activity yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const icon = ICONS[e.action] ?? "•";
        return (
          <li key={e.id} className="bg-white rounded-2xl px-4 py-3 text-sm flex items-start gap-3">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ backgroundColor: tileBg(icon) }}
            >
              {icon}
            </span>
            <span className="min-w-0">
              <span className="font-medium text-ink">{e.summary}</span>
              <span className="block text-xs text-warmgray mt-0.5">
                {e.createdAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

import { prisma } from "./prisma";

export async function logActivity(
  tripId: string,
  userId: string,
  action: "created" | "updated" | "deleted" | "joined",
  entityType: "expense" | "contribution" | "trip" | "member",
  summary: string
) {
  await prisma.activityLog.create({
    data: { tripId, userId, action, entityType, summary },
  });
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CURRENCY_CODES } from "@/lib/money";

export async function createTrip(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const baseCurrency = String(formData.get("baseCurrency") ?? "");
  const destCurrency = String(formData.get("destCurrency") ?? "");

  if (!name) throw new Error("Trip name is required");
  if (!CURRENCY_CODES.includes(baseCurrency) || !CURRENCY_CODES.includes(destCurrency)) {
    throw new Error("Unknown currency");
  }

  const trip = await prisma.trip.create({
    data: {
      name,
      baseCurrency,
      destCurrency,
      members: { create: { userId: user.id, role: "organizer" } },
    },
  });
  await logActivity(trip.id, user.id, "created", "trip", `${user.name} created the trip "${name}"`);
  redirect(`/trips/${trip.id}`);
}

export async function joinTrip(formData: FormData): Promise<void> {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  const trip = await prisma.trip.findUnique({ where: { inviteToken: token } });
  if (!trip) throw new Error("Invalid invite link");

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId: user.id } },
  });
  if (!existing) {
    await prisma.tripMember.create({ data: { tripId: trip.id, userId: user.id } });
    await logActivity(trip.id, user.id, "joined", "member", `${user.name} joined the trip`);
  }
  redirect(`/trips/${trip.id}`);
}

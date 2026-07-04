"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireMembership } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CURRENCY_CODES, formatMinor, toMinor } from "@/lib/money";

function fail(tripId: string, message: string): never {
  redirect(`/trips/${tripId}?tab=fund&error=${encodeURIComponent(message)}`);
}

export async function addContribution(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  await requireMembership(user.id, tripId);

  const contributorId = String(formData.get("contributorId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  await requireMembership(contributorId, tripId).catch(() =>
    fail(tripId, "The contributor must be a trip member.")
  );
  if (!CURRENCY_CODES.includes(currency)) fail(tripId, "Unknown currency.");

  let amountMinor: number;
  try {
    amountMinor = toMinor(amountRaw, currency);
  } catch {
    fail(tripId, `"${amountRaw}" is not a valid amount.`);
  }

  const date = new Date(dateRaw);
  if (isNaN(date.getTime())) fail(tripId, "Please pick a valid date.");

  const contribution = await prisma.fundContribution.create({
    data: { tripId, userId: contributorId, amountMinor, currency, date, note },
    include: { user: true },
  });
  await logActivity(
    tripId,
    user.id,
    "created",
    "contribution",
    `${user.name} logged a fund contribution of ${formatMinor(amountMinor, currency)} by ${contribution.user.name}`
  );
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?tab=fund`);
}

export async function deleteContribution(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("contributionId") ?? "");
  const contribution = await prisma.fundContribution.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!contribution) return;
  await requireMembership(user.id, contribution.tripId);

  await prisma.fundContribution.delete({ where: { id } });
  await logActivity(
    contribution.tripId,
    user.id,
    "deleted",
    "contribution",
    `${user.name} deleted ${contribution.user.name}'s fund contribution of ${formatMinor(contribution.amountMinor, contribution.currency)}`
  );
  revalidatePath(`/trips/${contribution.tripId}`);
  redirect(`/trips/${contribution.tripId}?tab=fund`);
}

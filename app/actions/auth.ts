"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export interface AuthState {
  error?: string;
}

async function joinTripByToken(userId: string, inviteToken: string): Promise<string | null> {
  const trip = await prisma.trip.findUnique({ where: { inviteToken } });
  if (!trip) return null;
  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId: trip.id, userId } },
  });
  if (!existing) {
    await prisma.tripMember.create({ data: { tripId: trip.id, userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await logActivity(trip.id, userId, "joined", "member", `${user?.name ?? "Someone"} joined the trip`);
  }
  return trip.id;
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "").trim();

  if (!name || !email || !password) return { error: "All fields are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "That doesn't look like an email address." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists — try signing in." };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password) },
  });
  await createSession(user.id);

  let tripId: string | null = null;
  if (invite) tripId = await joinTripByToken(user.id, invite);
  redirect(tripId ? `/trips/${tripId}` : "/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Wrong email or password." };
  }
  await createSession(user.id);

  let tripId: string | null = null;
  if (invite) tripId = await joinTripByToken(user.id, invite);
  redirect(tripId ? `/trips/${tripId}` : "/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

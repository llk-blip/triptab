"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireMembership } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CURRENCY_CODES, formatMinor, toMinor } from "@/lib/money";
import { FUND_ID } from "@/lib/settlement";

interface ParsedExpense {
  description: string;
  amountMinor: number;
  currency: string;
  date: Date;
  paidFromFund: boolean;
  payerId: string | null;
  splits: { userId: string; weight: number }[];
}

function fail(tripId: string, tab: string, message: string): never {
  redirect(`/trips/${tripId}?tab=${tab}&error=${encodeURIComponent(message)}`);
}

async function parseExpenseForm(tripId: string, formData: FormData): Promise<ParsedExpense> {
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "");
  const currency = String(formData.get("currency") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const payer = String(formData.get("payer") ?? "");

  if (!description) fail(tripId, "expenses", "Description is required.");
  if (!CURRENCY_CODES.includes(currency)) fail(tripId, "expenses", "Unknown currency.");

  let amountMinor: number;
  try {
    amountMinor = toMinor(amountRaw, currency);
  } catch {
    fail(tripId, "expenses", `"${amountRaw}" is not a valid amount.`);
  }

  const date = new Date(dateRaw);
  if (isNaN(date.getTime())) fail(tripId, "expenses", "Please pick a valid date.");

  const members = await prisma.tripMember.findMany({ where: { tripId } });
  const memberIds = new Set(members.map((m) => m.userId));

  const paidFromFund = payer === FUND_ID;
  if (!paidFromFund && !memberIds.has(payer)) {
    fail(tripId, "expenses", "The payer must be a trip member or the common fund.");
  }

  const splits: { userId: string; weight: number }[] = [];
  for (const id of memberIds) {
    if (formData.get(`split_${id}`) === "on") {
      const weight = Math.max(1, Math.round(Number(formData.get(`weight_${id}`) ?? 1)) || 1);
      splits.push({ userId: id, weight });
    }
  }
  if (splits.length === 0) {
    fail(tripId, "expenses", "Select at least one person to split the expense among.");
  }

  return {
    description,
    amountMinor,
    currency,
    date,
    paidFromFund,
    payerId: paidFromFund ? null : payer,
    splits,
  };
}

export async function addExpense(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  await requireMembership(user.id, tripId);
  const parsed = await parseExpenseForm(tripId, formData);

  await prisma.expense.create({
    data: {
      tripId,
      description: parsed.description,
      amountMinor: parsed.amountMinor,
      currency: parsed.currency,
      date: parsed.date,
      paidFromFund: parsed.paidFromFund,
      payerId: parsed.payerId,
      createdById: user.id,
      splits: { create: parsed.splits },
    },
  });
  await logActivity(
    tripId,
    user.id,
    "created",
    "expense",
    `${user.name} added expense "${parsed.description}" (${formatMinor(parsed.amountMinor, parsed.currency)}${parsed.paidFromFund ? ", paid from common fund" : ""})`
  );
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}?tab=expenses`);
}

export async function updateExpense(formData: FormData): Promise<void> {
  const user = await requireUser();
  const expenseId = String(formData.get("expenseId") ?? "");
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new Error("Expense not found");
  await requireMembership(user.id, expense.tripId);
  const parsed = await parseExpenseForm(expense.tripId, formData);

  await prisma.$transaction([
    prisma.expenseSplit.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        description: parsed.description,
        amountMinor: parsed.amountMinor,
        currency: parsed.currency,
        date: parsed.date,
        paidFromFund: parsed.paidFromFund,
        payerId: parsed.payerId,
        splits: { create: parsed.splits },
      },
    }),
  ]);
  await logActivity(
    expense.tripId,
    user.id,
    "updated",
    "expense",
    `${user.name} edited expense "${parsed.description}" (${formatMinor(parsed.amountMinor, parsed.currency)})`
  );
  revalidatePath(`/trips/${expense.tripId}`);
  redirect(`/trips/${expense.tripId}?tab=expenses`);
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const user = await requireUser();
  const expenseId = String(formData.get("expenseId") ?? "");
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return;
  await requireMembership(user.id, expense.tripId);

  await prisma.expense.delete({ where: { id: expenseId } });
  await logActivity(
    expense.tripId,
    user.id,
    "deleted",
    "expense",
    `${user.name} deleted expense "${expense.description}" (${formatMinor(expense.amountMinor, expense.currency)})`
  );
  revalidatePath(`/trips/${expense.tripId}`);
  redirect(`/trips/${expense.tripId}?tab=expenses`);
}

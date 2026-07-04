"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/actions/auth";

export default function AuthForm({
  mode,
  invite,
}: {
  mode: "login" | "signup";
  invite?: string;
}) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  const inviteSuffix = invite ? `?invite=${invite}` : "";

  return (
    <div className="mx-auto max-w-sm mt-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold mb-1">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        {invite && (
          <p className="text-sm text-emerald-700 mb-3">
            You&apos;ve been invited to a trip — {mode === "login" ? "sign in" : "sign up"} to join.
          </p>
        )}
        <form action={formAction} className="space-y-3 mt-3">
          {invite && <input type="hidden" name="invite" value={invite} />}
          {mode === "signup" && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Your name</span>
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Alice"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}
          <button
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "One moment…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup${inviteSuffix}`} className="text-emerald-700 underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login${inviteSuffix}`} className="text-emerald-700 underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

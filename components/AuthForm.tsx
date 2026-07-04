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
      <div className="bg-white rounded-3xl border-2 border-peach p-6">
        <h1 className="font-display text-2xl font-extrabold mb-1">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        {invite && (
          <p className="text-sm text-coral font-semibold mb-3">
            🎒 You&apos;ve been invited to a trip — {mode === "login" ? "sign in" : "sign up"} to
            join.
          </p>
        )}
        <form action={formAction} className="space-y-3 mt-3">
          {invite && <input type="hidden" name="invite" value={invite} />}
          {mode === "signup" && (
            <label className="block">
              <span className="text-sm font-semibold text-ink">Your name</span>
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Alice"
                className="mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm focus:outline-none focus:border-sunny"
              />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-semibold text-ink">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm focus:outline-none focus:border-sunny"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-xl border-2 border-peach px-3 py-2 text-sm focus:outline-none focus:border-sunny"
            />
          </label>
          {state.error && (
            <p className="text-sm text-coral bg-peachlight rounded-xl px-3 py-2 font-semibold">
              {state.error}
            </p>
          )}
          <button
            disabled={pending}
            className="w-full rounded-xl bg-coral text-white font-display font-bold py-2.5 text-sm hover:bg-[#e85d3d] disabled:opacity-50"
          >
            {pending ? "One moment…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-warmgray mt-4">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/signup${inviteSuffix}`} className="text-coral font-semibold underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login${inviteSuffix}`} className="text-coral font-semibold underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

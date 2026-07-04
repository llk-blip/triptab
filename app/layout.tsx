import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WanderPurse",
  description: "Shared trip expenses, common fund, and who-owes-whom",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <header className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight text-emerald-700">
              👛 WanderPurse
            </Link>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600 hidden sm:inline">{user.name}</span>
                <form action={logout}>
                  <button className="text-slate-500 hover:text-slate-800 underline underline-offset-2">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

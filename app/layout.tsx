import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TripTab",
  description: "Shared trip expenses, common fund, and who-owes-whom",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${baloo.variable} antialiased`}>
      <body className="min-h-screen">
        <header className="bg-white border-b-2 border-peach">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="font-display font-extrabold text-xl tracking-tight text-ink flex items-center gap-2"
            >
              <span className="text-2xl">🎒</span>TripTab
            </Link>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-inkmute hidden sm:inline">{user.name}</span>
                <form action={logout}>
                  <button className="rounded-full bg-ink text-white font-semibold px-4 py-1.5 text-xs hover:bg-[#33504F]">
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

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plant Pet Safety",
  description: "Identify plants and check pet-safety information for cats and dogs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <header className="border-b border-emerald-950/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-emerald-950"
            >
              Plant Pet Safety
            </Link>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
              >
                Analyze
              </Link>
              <Link
                href="/my-plants"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
              >
                My Plants
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto w-full max-w-5xl px-5 py-10 text-center text-xs text-slate-500 sm:px-8">
          Plant identification can be uncertain. Confirm a plant before relying on safety information.
        </footer>
      </body>
    </html>
  );
}

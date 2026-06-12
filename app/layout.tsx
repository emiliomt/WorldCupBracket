import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 Bracket",
  description: "Group standings with official FIFA 2026 tiebreaker rules",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide">
              FIFA World Cup 2026
            </h1>
            <nav className="flex gap-6 text-sm text-gray-400">
              <a href="/" className="hover:text-white transition-colors">Groups</a>
              <a href="/third-place" className="hover:text-white transition-colors">3rd Place</a>
              <a href="/admin" className="hover:text-white transition-colors">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

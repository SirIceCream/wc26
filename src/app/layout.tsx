import type { Metadata } from "next";
import { AppNav } from "@/components/app/app-nav";
import { RouteLoadingIndicator } from "@/components/app/route-loading-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC26 Tipps",
  description: "Private WM-2026-Tipprunde für Freunde.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <RouteLoadingIndicator />
        <AppNav />
        <main className="pb-24 md:pb-0">{children}</main>
      </body>
    </html>
  );
}

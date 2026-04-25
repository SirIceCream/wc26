import type { Metadata } from "next";
import { AppNav } from "@/components/app/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC26 Predictions",
  description: "Private friends-only World Cup 2026 predictions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        <main className="pb-24 md:pb-0">{children}</main>
      </body>
    </html>
  );
}

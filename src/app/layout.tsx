import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MPP Playground",
  description:
    "Inspect MPP endpoints, pay with a passkey-based Tempo Wallet, and generate hosted payment links — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full antialiased",
        geistSans.variable,
        ibmPlexMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
      <Analytics />
    </html>
  );
}

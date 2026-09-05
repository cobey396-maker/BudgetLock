import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import ServiceWorker from "@/components/ServiceWorker";

// Self-hosted at build time: no request to fonts.googleapis.com at runtime,
// which keeps the CSP tight and avoids leaking visitors' IPs to a third party.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-grotesk",
});

const title = "BudgetLock — set a limit, watch the needle";
const description = "Set a monthly limit. Watch the needle. Stay out of the red.";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: title, template: "%s · BudgetLock" },
  description,
  applicationName: "BudgetLock",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BudgetLock" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    siteName: "BudgetLock",
    title,
    description,
    url: env.appUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "BudgetLock" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  // Accounts hold financial data; there is nothing here worth indexing beyond
  // the marketing surface, and signed-in views must never be crawled.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#17171C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}

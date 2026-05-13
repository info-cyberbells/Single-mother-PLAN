import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

export const metadata: Metadata = {
  title: "MomPlan — AI-Powered Government Benefits Platform",
  description:
    "MomPlan scans 200+ federal and state programs to match your family with hidden benefits. From childcare subsidies to nutrition assistance, get personalized guidance fast.",
  keywords: "government benefits, family assistance, SNAP, WIC, Medicaid, childcare subsidies, eligibility scan",
  openGraph: {
    title: "MomPlan — AI-Powered Government Benefits Platform",
    description: "Discover all the benefits your family qualifies for in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

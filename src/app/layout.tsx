import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/context";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2c3c2c",
};

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://eatmunchis.com";

export const metadata: Metadata = {
  applicationName: "munchis",
  title: {
    default: "munchis",
    template: "%s | munchis",
  },
  description: "Postres artesanales en drops semanales. Pide antes de que se agoten.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(DOMAIN),
  appleWebApp: {
    capable: true,
    title: "munchis",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "munchis — postres artesanales",
    description: "Drops semanales, hechos a mano. Pide antes de que se agoten.",
    url: DOMAIN,
    siteName: "munchis",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "munchis — postres artesanales",
      },
    ],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "munchis — postres artesanales",
    description: "Drops semanales, hechos a mano. Pide antes de que se agoten.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: DOMAIN,
  },
  icons: {
    apple: "/images/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="min-h-screen overflow-x-hidden">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

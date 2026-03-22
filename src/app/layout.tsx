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
    default: "munchis | Handmade Treats, Fresh Every Sunday",
    template: "%s | munchis",
  },
  description: "Galletas y postres artesanales en San Salvador, hechos a mano desde cero. Un sabor por semana, en lotes pequeños. Pide antes de que se agoten. Handmade cookies and treats in El Salvador — one flavor per drop, baked fresh every Sunday.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(DOMAIN),
  keywords: [
    "galletas artesanales san salvador",
    "galletas caseras san salvador",
    "postres artesanales el salvador",
    "repostería artesanal san salvador",
    "homemade cookies san salvador",
    "handmade treats el salvador",
    "galletas por encargo san salvador",
    "artisan bakery el salvador",
    "munchis",
    "eatmunchis",
  ],
  appleWebApp: {
    capable: true,
    title: "munchis",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "munchis — Galletas y Postres Artesanales en San Salvador",
    description: "Hechos a mano, en lotes pequeños. Un sabor por semana — pide antes de que se agoten.",
    url: DOMAIN,
    siteName: "munchis",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "munchis — galletas artesanales, horneadas frescas cada domingo en San Salvador",
      },
    ],
    locale: "es_SV",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "munchis | Handmade Treats, Fresh Every Sunday",
    description: "Galletas y postres artesanales en San Salvador. Un sabor por semana, hechos a mano desde cero.",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Bakery",
              name: "munchis",
              alternateName: "eatmunchis",
              url: DOMAIN,
              logo: `${DOMAIN}/images/munchis-icon.svg`,
              image: `${DOMAIN}/images/og-image.png`,
              description:
                "Galletas y postres artesanales en San Salvador, hechos a mano desde cero por Heidi, ingeniera de alimentos y chef pastelera. Un sabor por semana, en lotes pequeños. Handmade cookies and artisan treats in El Salvador.",
              founder: {
                "@type": "Person",
                name: "Heidi",
                jobTitle: "Food Engineer & Pastry Chef",
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: "San Salvador",
                addressCountry: "SV",
              },
              areaServed: {
                "@type": "City",
                name: "San Salvador",
              },
              sameAs: [
                "https://instagram.com/eatmunchis",
                "https://tiktok.com/@eatmunchis",
                "https://youtube.com/@eatmunchis",
                "https://facebook.com/eatmunchis",
              ],
              knowsAbout: [
                "galletas artesanales",
                "postres artesanales",
                "repostería artesanal",
                "homemade cookies",
                "handmade treats",
                "small-batch baking",
              ],
              priceRange: "$",
              currenciesAccepted: "USD",
              paymentAccepted: "Online payment",
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Sunday",
                description: "Weekly pickup day for fresh-baked treats",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

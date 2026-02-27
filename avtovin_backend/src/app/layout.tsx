import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Payda — Гарантийное обслуживание авто в Казахстане",
  description:
    "Гарантия на автомобиль в Казахстане. Оформление через партнёрские сервисные центры. Гарантийное обслуживание, 50+ партнёров в 10+ городах.",
  keywords: [
    "гарантия на авто",
    "гарантийное обслуживание",
    "автострахование",
    "Payda",
    "кешбэк",
    "сервисный центр",
    "ТО",
    "обслуживание авто",
  ],
  authors: [{ name: "Payda" }],
  openGraph: {
    title: "Payda — Гарантийное обслуживание авто в Казахстане",
    description:
      "Гарантия на автомобиль. Оформление через партнёрские сервисные центры по всему Казахстану.",
    locale: "ru_KZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Payda — Гарантийное обслуживание авто в Казахстане",
    description:
      "Гарантия на автомобиль. Оформление через партнёрские сервисные центры по всему Казахстану.",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Payda",
              description:
                "Гарантийное обслуживание авто с кешбэком в Казахстане. Партнёрские сервисные центры по всей стране.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "paydacasco@gmail.com",
                contactType: "customer service",
                areaServed: "KZ",
                availableLanguage: "Russian",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased font-[family-name:var(--font-inter)]`}>
        {children}
      </body>
    </html>
  );
}

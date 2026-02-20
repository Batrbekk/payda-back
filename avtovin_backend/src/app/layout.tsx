import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "casco.kz — Автострахование с кешбэком в Казахстане",
  description:
    "Оформляйте КАСКО через партнёрские сервисные центры. Кешбэк 500₸ за каждое обслуживание через приложение Payda. 50+ партнёров в 10+ городах Казахстана.",
  keywords: [
    "КАСКО",
    "автострахование",
    "Казахстан",
    "кешбэк",
    "сервисный центр",
    "Payda",
    "casco.kz",
    "страхование авто",
    "ТО",
    "обслуживание авто",
  ],
  authors: [{ name: "casco.kz" }],
  openGraph: {
    title: "casco.kz — Автострахование с кешбэком",
    description:
      "Оформляйте КАСКО через партнёрские сервисные центры. Кешбэк 500₸ за каждое обслуживание.",
    url: "https://casco.kz",
    siteName: "casco.kz",
    locale: "ru_KZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "casco.kz — Автострахование с кешбэком",
    description:
      "Оформляйте КАСКО через партнёрские сервисные центры. Кешбэк 500₸ за каждое обслуживание.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://casco.kz",
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
              name: "casco.kz",
              url: "https://casco.kz",
              description:
                "Автострахование с кешбэком в Казахстане. Партнёрские сервисные центры по всей стране.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "info@casco.kz",
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

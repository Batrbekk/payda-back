import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "casco.kz — КАСКО страхование и гарантия авто в Казахстане",
  description:
    "КАСКО страховка и гарантия на автомобиль в Казахстане. Оформление каско через партнёрские сервисные центры. Страховка каско, гарантийное обслуживание, 50+ партнёров в 10+ городах.",
  keywords: [
    "каско",
    "КАСКО",
    "страховка",
    "страховка каско",
    "каско Казахстан",
    "каско Алматы",
    "каско Астана",
    "автострахование",
    "страхование авто",
    "страховка авто",
    "гарантия на авто",
    "гарантийное обслуживание",
    "casco",
    "casco.kz",
    "каско онлайн",
    "оформить каско",
    "сервисный центр",
    "ТО",
    "обслуживание авто",
    "Payda",
    "кешбэк",
  ],
  authors: [{ name: "casco.kz" }],
  openGraph: {
    title: "casco.kz — КАСКО страхование и гарантия авто в Казахстане",
    description:
      "КАСКО страховка и гарантия на автомобиль. Оформление каско через партнёрские сервисные центры по всему Казахстану.",
    url: "https://casco.kz",
    siteName: "casco.kz",
    locale: "ru_KZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "casco.kz — КАСКО страхование и гарантия авто в Казахстане",
    description:
      "КАСКО страховка и гарантия на автомобиль. Оформление каско через партнёрские сервисные центры по всему Казахстану.",
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

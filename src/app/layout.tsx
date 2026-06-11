import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "BeautyOS — AI-платформа для возврата клиентов салона красоты",
  description: "BeautyOS анализирует клиентскую базу салона и каждый день говорит: кому позвонить, что сказать и сколько денег вернёте. Загрузите CSV из DIKIDI или YClients — первые инсайты за 2 минуты.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BeautyOS",
    statusBarStyle: "black-translucent",
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
    <html
      lang="ru"
      className={`${manrope.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppGuideWrapper } from "@/components/ui/AppGuideWrapper"
import { TrialBannerWrapper } from "@/components/ui/TrialBannerWrapper";

// IMPORTANT: Do not remove this line.
//
// Mobile Safari (iOS) hangs when the root layout is pre-rendered and cached
// by Vercel's PPR (Partial Pre-Rendering). The cached shell + streamed dynamic
// content produces a two-phase HTTP response that WebKit terminates with:
// "Safari could not open the page because the server stopped responding."
//
// force-dynamic on the ROOT LAYOUT disables shell caching entirely, so every
// response is a single complete document. Desktop Chrome is lenient; iOS WebKit
// is strict — this line is what keeps iPhone users from seeing a blank screen.
//
// Symptoms if removed: x-nextjs-prerender: 1 reappears in response headers;
// iPhone Safari intermittently fails, especially right after deployments.
// See: docs/architecture/mobile-stability.md
export const dynamic = 'force-dynamic'

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

// Viewport exported separately — Next.js 16 manages the meta tag.
// DO NOT also put <meta name="viewport"> in <head> — duplicates break iOS Safari.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "BeautyOS — AI-платформа для возврата клиентов салона красоты",
  description: "BeautyOS анализирует клиентскую базу салона и каждый день говорит: кому позвонить, что сказать и сколько денег вернёте. Загрузите CSV из DIKIDI или YClients — первые инсайты за 2 минуты.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BeautyOS",
    statusBarStyle: "black-translucent",
  },
  // NOTE: do NOT add "mobile-web-app-capable" here — appleWebApp.capable already covers it.
  // A duplicate <meta name="mobile-web-app-capable"> also breaks iOS Safari.
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
        <link rel="apple-touch-icon" href="/apple-touch-icon-v2.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <TrialBannerWrapper />
        </Suspense>
        <Suspense fallback={null}>{children}</Suspense>
        <Suspense fallback={null}>
          <AppGuideWrapper />
        </Suspense>
      </body>
    </html>
  );
}

/**
 * ============================================================
 * Root Layout
 * ============================================================
 *
 * Next.js App Router root layout — wraps every page in the app.
 *
 * ADDED (1.4):
 *   <Toaster /> from sonner mounted here once at the root level.
 *   This makes toast notifications available on every page without
 *   needing to mount the provider per-page.
 *
 *   Configuration:
 *   - position: "bottom-right" — unobtrusive, standard for web apps
 *   - richColors: true — uses semantic colors (green=success, red=error)
 *   - duration: 3000ms — long enough to read, short enough not to annoy
 * ============================================================
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "./components/navigation/nav-bar";
import { Footer } from "./components/footer";
import GoogleAnalytics from "./components/google-analytics";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Minor Project | Create Ingredient Based Nutrition Labels',
    template: '%s | Ingredient Based Nutrition Label Generator'
  },
  description: 'Create FDA-compliant nutrition labels. Perfect for food manufacturers, small businesses & nutritionists. Supports US, EU, Indian, Australian & Canadian standards.',
  openGraph: {
    type: 'website',
    siteName: 'Ingredient Based Nutrition Label Generator',
    title: 'Nutrition Label Generator | Create Nutrition Labels Instantly',
    description: 'Create FDA-compliant nutrition labels. Perfect for food manufacturers, small businesses & nutritionists.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nutrition Label Maker - Free Online Tool'
      },
    ],
  },
  keywords: [
    'free nutrition label maker',
    'FDA nutrition label generator',
    'free food label creator',
    'nutrition facts generator',
    'food labeling tool',
    'free label maker',
    'FDA compliant labels',
    'nutrition facts template',
    'food manufacturer tools',
    'small business label maker'
  ],
  authors: [{ name: 'Sai Amar' }],
  creator: 'Sai Amar',
  publisher: 'Sai Amar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: '7nItEeuNSAIFL_unU4Ai5p-SGizDDaJU8XRYEKdtOgk',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        }>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </Suspense>

        {/*
          Global toast notification provider.
          Mounted outside Suspense so toasts work even during
          suspense boundaries resolving.
          richColors maps: success→green, error→red, info→blue, warning→amber
        */}
        <Toaster
          position="bottom-right"
          richColors
          duration={3000}
          closeButton
        />
      </body>
    </html>
  );
}
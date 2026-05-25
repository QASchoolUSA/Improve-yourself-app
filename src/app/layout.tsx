import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/TabBar";
import { SWRegister } from "@/components/SWRegister";
import { ReminderRunner } from "@/components/ReminderRunner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coach — become who you want to be",
  description:
    "Your AI personal trainer. Set goals, get a plan, ship daily, become better.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Coach",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} dark`}>
      <body className="min-h-screen-safe bg-bg text-fg">
        <div className="mx-auto flex min-h-screen-safe max-w-md flex-col">
          <main className="flex-1 pb-28">{children}</main>
          <TabBar />
        </div>
        <SWRegister />
        <ReminderRunner />
      </body>
    </html>
  );
}

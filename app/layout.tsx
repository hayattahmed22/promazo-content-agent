import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const _geistSans = Geist({
  subsets: ["latin"],
});

const _geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProMazo Content Agent | AI-Powered Podcast to Short-Form Content",
  description:
    "Transform long-form podcasts into viral short-form content with AI-powered analysis, clip suggestions, and automated video generation.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

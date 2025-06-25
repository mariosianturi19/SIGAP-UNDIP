// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./toast.css"
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGAP UNDIP",
  description: "Sistem Informasi Gawat dan Pelaporan Universitas Diponegoro",
  icons: {
    icon: [
      { url: '/images/icon.ico', sizes: 'any' },
      { url: '/images/Undip-Logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/Undip-Logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/images/Undip-Logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/images/icon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Multiple favicon formats for better compatibility */}
        <link rel="icon" href="/images/icon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/Undip-Logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/Undip-Logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/Undip-Logo.png" />
        
        {/* Force refresh icon cache */}
        <meta name="msapplication-TileImage" content="/images/Undip-Logo.png" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} 
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
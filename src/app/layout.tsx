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
      { url: '/images/Undip-Logo.png' }, // Ikon utama dari file PNG
    ],
    apple: { url: '/images/Undip-Logo.png' }, // Untuk perangkat Apple
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
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
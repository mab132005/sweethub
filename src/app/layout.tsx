import type { Metadata, Viewport } from "next"; // أضفنا Viewport هنا
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. كائن الـ metadata النظيف المتوافق مع المعايير الحالية
export const metadata: Metadata = {
  title: "SweetHub - Multi-Store Digital Catalog",
  description: "Create your online digital catalog and receive orders via WhatsApp",
  manifest: "/manifest.json", 
};

// 2. فصل الـ themeColor في كائن الـ viewport المخصص لمنع التحذيرات الصفراء
export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <AuthProvider>
          <CartProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Amiri, Noto_Kufi_Arabic, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-noto-kufi",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "المنصة القضائية الذكية — Egyptian Judicial Smart V2.1",
  description:
    "منصة سيادية للذكاء القضائي والبحث القانوني وتنظيم الأدلة ودعم التسبيب — النسخة 2.1 — تجربة قضائية مقيّدة — للقاضي شريف",
  keywords: [
    "القضاء المصري", "الذكاء القضائي", "بحث قانوني", "تنظيم الأدلة",
    "Egyptian Judicial Smart", "judicial intelligence", "legal research",
  ],
  authors: [{ name: "Egyptian Judicial Smart — Court-Pilot" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${amiri.variable} ${notoKufi.variable} ${jetbrains.variable} font-kufi antialiased`}
      >
        {children}
        <Toaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}

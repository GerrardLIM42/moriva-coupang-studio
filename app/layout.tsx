import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MORIVA 쿠팡 콘텐츠 스튜디오",
  description: "제품, 경쟁사, 리뷰 이미지를 분석해 쿠팡 썸네일과 상세페이지 프롬프트를 만드는 도구",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [{ url: "/moriva-favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.ico",
    apple: "/moriva-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

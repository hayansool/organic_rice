import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "하얀술의 유기농 새청무 주문",
  description: "서영암 산지직송 유기농 새청무 주문 가이드",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

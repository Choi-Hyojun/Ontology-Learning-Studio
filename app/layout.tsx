import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_BOOTSTRAP } from "./theme-model";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ontology Learning Studio — NeOn-GPT & TAO",
  description: "NeOn-GPT와 TAO 온톨로지 생성 과정을 실행하고 관찰하는 워크벤치",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} /></head><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>;
}

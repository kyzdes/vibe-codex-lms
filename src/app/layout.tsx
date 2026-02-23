import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VibeLearn — Обучение вайб-кодингу и AI",
    template: "%s | VibeLearn",
  },
  description: "Минималистичная LMS-платформа для обучения вайб-кодингу и применению AI для профессионалов цифровых профессий.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

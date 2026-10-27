import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShipShape AI — Release Readiness Dashboard",
  description:
    "Release-readiness dashboard and DevSecOps automation workflow. Track your code from commit to production with automated checks, security scanning, and approval gates.",
  keywords: [
    "DevSecOps",
    "release readiness",
    "CI/CD",
    "GitLab",
    "pipeline dashboard",
    "security scanning",
    "approval gate",
  ],
  authors: [{ name: "ShipShape AI Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}

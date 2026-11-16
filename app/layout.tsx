import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

// Fonts come from the `geist` npm package (self-hosted), so the build
// doesn't depend on reaching Google Fonts.

export const metadata: Metadata = {
  title: "Sales Order Monitor",
  description:
    "Monitor sales orders across branches (assessment build, mock data).",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-MY" className={`${GeistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { EASYLIFE_BRAND } from "@easylife/shared-config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${EASYLIFE_BRAND.name} — ${EASYLIFE_BRAND.slogan}`,
  description: EASYLIFE_BRAND.description,
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/easylife-official-mark.png", type: "image/png", sizes: "180x180" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--easylife-background)] text-[var(--easylife-text)] antialiased">
        {children}
      </body>
    </html>
  );
}

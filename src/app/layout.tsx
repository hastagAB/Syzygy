import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syzygy - Satellite Transit Finder",
  description:
    "Predict when ISS, Hubble, and Tiangong transit the Sun or Moon from your location",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}

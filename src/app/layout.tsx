import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Syzygy - Satellite Transit Finder",
  description:
    "Predict when ISS, Hubble, and Tiangong transit the Sun or Moon from your location. Find the perfect observation point within your travel radius.",
  keywords: ["ISS transit", "solar transit", "lunar transit", "satellite", "astronomy"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}

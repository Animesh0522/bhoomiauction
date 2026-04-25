import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Bhoomi Auction — Premium Real Estate Auctions in India",
    template: "%s | Bhoomi Auction",
  },
  description:
    "India's most trusted platform for transparent, real-time real estate auctions. Bid on verified residential, commercial, and agricultural properties.",
  keywords: ["real estate auction", "property auction india", "bhoomi auction", "land auction", "commercial property auction"],
  authors: [{ name: "Bhoomi Auction" }],
  creator: "Bhoomi Auction",
  metadataBase: new URL("https://bhoomiauction.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bhoomiauction.com",
    siteName: "Bhoomi Auction",
    title: "Bhoomi Auction — Premium Real Estate Auctions in India",
    description:
      "India's most trusted platform for transparent, real-time real estate auctions. Bid on verified residential, commercial, and agricultural properties.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhoomi Auction — Premium Real Estate Auctions",
    description: "Bid on verified properties across India. Transparent, secure, real-time.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", inter.variable)}>
      <body className="antialiased bg-background text-foreground">
        <AuthGuard />
        {children}
      </body>
    </html>
  );
}

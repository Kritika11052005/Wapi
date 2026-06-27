import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Wapi — Your inbox, but it thinks like you.",
  description: "Wapi is an AI-powered WhatsApp CRM built for Indian small business owners — salons, clinics, tutoring centres, gyms, and local service providers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0B3D52] text-slate-100">
        {children}
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  );
}

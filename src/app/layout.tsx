import type { Metadata } from "next";
import { Space_Grotesk, Handjet } from "next/font/google";
import { GridBackground } from "@/components/layout/GridBackground";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const handjet = Handjet({
  variable: "--font-handjet",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Cherrisha Shetty — UI/UX Designer",
  description: "Portfolio of Cherrisha Shetty, UI/UX and graphic designer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${handjet.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
          <GridBackground />
          <Navbar />
          {children}
        </body>
    </html>
  );
}

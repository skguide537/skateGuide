import NavBar from "@/components/navbar/NavBar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkateGuide",
  description: "Find the best skate spots near you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-canvas text-grip`}>
        <NavBar />
        <main className="min-h-screen flex flex-col items-center justify-start text-center px-4">
          {children}
        </main>
      </body>
    </html>
  );
}

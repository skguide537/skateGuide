import NavBar from "@/components/navbar/NavBar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";

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
                <UserProvider>
                    <ToastProvider>
                        <NavBar />
                        <main className="min-h-screen flex flex-col items-center justify-start text-center px-4">
                            {children}
                        </main>
                    </ToastProvider>
                </UserProvider>
            </body>
        </html>
    );
}
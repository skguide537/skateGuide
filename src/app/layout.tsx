import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/navbar/NavBar';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import Loading from '@/components/loading/Loading';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SkateGuide - Discover Skateparks Near You',
  description: 'Find, rate, and share skateparks around your city. From wooden ramps to metallic rails, discover the best spots for skating.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <ToastProvider>
            <NavBar />
            <Suspense fallback={<Loading />}>
              {children}
            </Suspense>
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/navbar/NavBar';
import Loading from '@/components/loading/Loading';
import ReduxProvider from '@/components/providers/ReduxProvider';
import Toast from '@/components/common/Toast';

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
        <ReduxProvider>
          <NavBar />
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
          <Toast />
        </ReduxProvider>
      </body>
    </html>
  );
}
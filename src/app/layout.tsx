import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/navbar/NavBar';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { GeolocationProvider } from '@/context/GeolocationContext';
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
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              <FavoritesProvider>
                <GeolocationProvider>
                  <NavBar />
                  <Suspense fallback={<Loading />}>
                    {children}
                  </Suspense>
                </GeolocationProvider>
              </FavoritesProvider>
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
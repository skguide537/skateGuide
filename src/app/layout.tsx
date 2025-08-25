import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/navbar/NavBar';
import { UserProvider } from '@/context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('skateGuide-theme');
                  if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var defaultTheme = prefersDark ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', defaultTheme);
                  }
                } catch (e) {
                  // Fallback to light theme if localStorage fails
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              <FavoritesProvider>
                <NavBar />
                <Suspense fallback={<Loading />}>
                  {children}
                </Suspense>
              </FavoritesProvider>
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
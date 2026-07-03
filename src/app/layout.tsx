import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SnackbarProvider } from '@/context/SnackbarContext';

export const metadata: Metadata = {
  title: 'CINARAI - Critical Numeracy with AR & AI',
  description: 'Platform pembelajaran numerasi berbasis etnomatematika',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <SnackbarProvider>
            {children}
          </SnackbarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

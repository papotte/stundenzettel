import BottomNav from '@/components/ui/bottom-nav';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/auth-context';
import { I18nProvider } from '@/context/i18n-context';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimeWise Tracker',
  description: 'Track your work hours effortlessly',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <I18nProvider>
            {children}
            <BottomNav />
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

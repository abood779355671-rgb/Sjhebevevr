import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تحفة - دعوات أعراس بلمسة فاخرة',
  description: 'أداة شخصية لتصميم وإدارة دعوات الأعراس الرقمية',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-noto antialiased">{children}</body>
    </html>
  );
}

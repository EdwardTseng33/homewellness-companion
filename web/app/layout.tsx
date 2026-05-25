import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HomeWellness Companion · 家暖',
  description:
    'Elder care AI · proactive companion · Claude Sonnet 4.5 + 5 tools + 4 scenarios',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF6F0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-cream antialiased">{children}</body>
    </html>
  );
}

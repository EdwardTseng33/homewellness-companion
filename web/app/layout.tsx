import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CAREON Companion · AI 智慧身心照護 + 智能給藥機',
  description:
    'CAREON · 銀髮居家身心照護員 · Claude Sonnet 4.6 + 5 tools + 4 scenarios · Safety Guardrail',
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

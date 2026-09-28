import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chronos 3D • Celestial Day-to-Day Life Scheduler & Gemini AI',
  description:
    'Interactive 3D day-to-day life scheduler with real-time pending vs done work analytics, smart reminders, built-in Google Gemini AI, and MongoDB cloud sync.',
  keywords: [
    '3D scheduler',
    'productivity',
    'day-to-day planner',
    'three.js',
    'gemini ai',
    'reminders',
    'mongodb',
    'task manager',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

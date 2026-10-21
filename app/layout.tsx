import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--f-display', weight: ['500', '700'] });
const body = Figtree({ subsets: ['latin'], variable: '--f-body' });

export const metadata: Metadata = {
  title: 'Contas',
  description: 'Gastos e recebimentos registados pelo WhatsApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}

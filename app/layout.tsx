import type { Metadata } from 'next';
import './globals.css';
import { Provider } from '@/components/Provider';

export const metadata: Metadata = {
  title: 'Purrfect Chess - Next.js Migration',
  description:
    'Cat-themed chess board with local Stockfish, appearance sliders, and time controls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Concensor',
  description: 'The most objective place to discuss politics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


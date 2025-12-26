import type { Metadata } from 'next';
import '../src/index.css';
import { AuthProvider } from '@/contexts/AuthContext';

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
      {/* 
        suppressHydrationWarning on body prevents hydration errors from browser extensions
        (like Grammarly) that modify the DOM by adding attributes to body tag
        This is safe because these attributes don't affect React's functionality
      */}
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


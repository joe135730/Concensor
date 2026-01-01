'use client';

/**
 * Messages Page
 * 
 * Route: /messages
 * Shows user's messages/conversations with other users.
 * Requires authentication.
 * 
 * TODO: Implement messaging backend and UI
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/common/Sidebar';
import './page.css';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="messages-page">
        <div className="messages-page-content">
          <Sidebar />
          <main className={`messages-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <h1 className="messages-title">Messages</h1>
            <div className="messages-placeholder">
              <p>Messaging feature coming soon!</p>
              <p className="messages-placeholder-subtitle">
                You'll be able to send and receive messages with other users here.
              </p>
            </div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}


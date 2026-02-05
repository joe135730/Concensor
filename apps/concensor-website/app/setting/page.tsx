'use client';

/**
 * Setting Page
 *
 * Route: /setting
 * Profile settings entry page.
 * Requires authentication.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ProfileSidebar from '@/components/common/ProfileSidebar';
import BackgroundImage from '@/components/common/BackgroundImage';
import './page.css';

export default function SettingPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { sidebarOpen } = useSidebar();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <div className="setting-page">
        <div className="setting-page-content">
          <ProfileSidebar />
          <main className={`setting-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <BackgroundImage className="setting-background">
              <div className="setting-container">
                <h1 className="setting-title">Setting</h1>
                <div className="setting-cards">
                  <button className="setting-card" type="button">
                    <span className="setting-card-icon" aria-hidden="true">🌐</span>
                    <span className="setting-card-label">Language</span>
                  </button>
                  <button className="setting-card" type="button">
                    <span className="setting-card-icon" aria-hidden="true">🛡️</span>
                    <span className="setting-card-label">Privacy</span>
                  </button>
                </div>
              </div>
            </BackgroundImage>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

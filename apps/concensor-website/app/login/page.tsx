'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/common/BackgroundImage';
import MainLayout from '@/layouts/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect authenticated users to home page
  // Prevents authenticated users from accessing login page (e.g., browser back button)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Use replace() to avoid adding login page to history
      // This prevents glitch and makes redirect immediate
      router.replace('/home');
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while checking auth or if authenticated (will redirect)
  // This prevents the header from glitching during redirect
  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <BackgroundImage>
      <MainLayout>
      <div className="login-page">
        <div className="login-page-content">
          <LoginForm />
        </div>
      </div>
      </MainLayout>
    </BackgroundImage>
  );
}


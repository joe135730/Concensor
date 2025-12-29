'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/common/BackgroundImage';
import MainLayout from '@/layouts/MainLayout';
import SignUpForm from '@/components/auth/SignUpForm';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect authenticated users to home page
  // Prevents authenticated users from accessing signup page (e.g., browser back button)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Use replace() to avoid adding signup page to history
      // This prevents glitch and makes redirect immediate
      router.replace('/home');
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while checking auth or if authenticated (will redirect)
  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <BackgroundImage>
      <MainLayout>
        <div className="signup-page">
          <div className="signup-page-content">
            <SignUpForm />
          </div>
        </div>
      </MainLayout>
    </BackgroundImage>
  );
}

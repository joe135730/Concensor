'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';
import BackgroundImage from '@/components/common/BackgroundImage';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import './page.css';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);

  // If no email in URL, redirect to signup
  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  // Function to check auth status and return if verified
  // Using useCallback to make it stable for useEffect dependencies
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      // Check auth status directly via API (don't rely on context state)
      const response = await api.getProfile();
      if (response.user || response) {
        // User is authenticated - update context and return true
        await checkAuth(); // Update context state
        return true;
      }
      return false;
    } catch (error) {
      // Not authenticated
      return false;
    }
  }, [checkAuth]);

  // Check if user is already authenticated on page load (in case they refresh after verification)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // User is authenticated, redirect to home
      setIsVerified(true);
      // Show success message briefly, then redirect
      // Use replace() to avoid adding verify-email to history
      setTimeout(() => {
        router.replace('/home');
      }, 2000);
    }
  }, [isAuthenticated, authLoading, router]);

  // Check auth when page becomes visible again (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isVerified) {
        // Page became visible, check if user verified in another tab
        const isAuth = await checkAuthStatus();
        if (isAuth) {
          setIsVerified(true);
          setTimeout(() => {
            router.replace('/home');
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVerified, router, checkAuthStatus]);

  // Handle navigation clicks - check auth before navigating
  const handleNavigationClick = async (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    
    // Check auth status first - wait for result
    const isAuth = await checkAuthStatus();
    
    if (isAuth) {
      // User is verified - go directly to home, don't show login page
      router.replace('/home');
    } else {
      // Not verified - navigate to intended destination
      router.push(href);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    setResendMessage('');
    setResendError('');

    try {
      const response = await api.resendVerification(email);
      const message = response.message || 'Verification email sent! Please check your inbox.';
      
      // Check if email is already verified (from backend response)
      if (response.alreadyVerified || 
          message.toLowerCase().includes('already verified') || 
          message.toLowerCase().includes('can log in')) {
        // Email already verified - refresh auth status and show popup
        await checkAuth(); // Refresh auth state
        setShowVerifiedModal(true);
      } else {
        setResendMessage(message);
      }
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Handle "Go to Home" from verified modal
  const handleGoToHome = async () => {
    setShowVerifiedModal(false);
    // Refresh auth state to ensure we're logged in
    await checkAuth();
    router.replace('/home');
  };

  // Get email provider for mailto link
  const getEmailProvider = (email: string): string => {
    if (email.includes('gmail.com')) return 'https://mail.google.com';
    if (email.includes('outlook.com') || email.includes('hotmail.com')) return 'https://outlook.live.com';
    if (email.includes('yahoo.com')) return 'https://mail.yahoo.com';
    return `mailto:${email}`;
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  // Show verified success state
  if (isVerified) {
    return (
      <BackgroundImage>
        <MainLayout>
          <div className="verify-email-page">
            <div className="verify-email-container">
              <div className="verify-email-icon verified">✓</div>
              <h1 className="verify-email-title">Email Verified!</h1>
              <p className="verify-email-message">
                Your email has been successfully verified. Redirecting to home page...
              </p>
            </div>
          </div>
        </MainLayout>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <MainLayout>
        <div className="verify-email-page">
          <div className="verify-email-container">
            <div className="verify-email-icon">📧</div>
            <h1 className="verify-email-title">Check Your Email</h1>
            <p className="verify-email-message">
              We've sent a verification link to:
            </p>
            <p className="verify-email-address">{email}</p>
            <p className="verify-email-instructions">
              Please click the link in the email to verify your account and complete your registration.
            </p>

            <div className="verify-email-actions">
              <a
                href={getEmailProvider(email)}
                target="_blank"
                rel="noopener noreferrer"
                className="verify-email-button primary"
              >
                Open Email
              </a>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="verify-email-button secondary"
              >
                {resending ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </div>

            {resendMessage && (
              <div className="verify-email-success">{resendMessage}</div>
            )}

            {resendError && (
              <div className="verify-email-error">{resendError}</div>
            )}

            <div className="verify-email-footer">
              <p className="verify-email-help">
                After clicking the verification link in your email, you can refresh this page or click any navigation link to continue.
              </p>
              <p className="verify-email-help">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  className="verify-email-link"
                  disabled={resending}
                >
                  resend it
                </button>
                .
              </p>
              <p className="verify-email-back">
                <Link 
                  href="/login" 
                  className="verify-email-link"
                  onClick={(e) => handleNavigationClick(e, '/login')}
                >
                  Back to Login
                </Link>
              </p>
            </div>

            {/* Verified Modal Popup */}
            {showVerifiedModal && (
              <div className="verify-email-modal-overlay" onClick={() => setShowVerifiedModal(false)}>
                <div className="verify-email-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="verify-email-modal-icon">✓</div>
                  <h2 className="verify-email-modal-title">Email Already Verified!</h2>
                  <p className="verify-email-modal-message">
                    Your email has already been verified. You can now log in and access your account.
                  </p>
                  <div className="verify-email-modal-actions">
                    <button
                      type="button"
                      onClick={handleGoToHome}
                      className="verify-email-button primary"
                    >
                      Go to Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVerifiedModal(false)}
                      className="verify-email-button secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </BackgroundImage>
  );
}


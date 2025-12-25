'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import './LoginForm.css';

const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      // TODO: Store token and redirect
      console.log('Login successful:', response);
      router.push('/'); // Redirect to home page after login
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
  };

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (email && !validateEmail(email)) {
      setEmailError('Invalid email format! Please check again');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing again
    if (emailError && emailTouched) {
      if (validateEmail(e.target.value)) {
        setEmailError('');
      }
    }
  };

  return (
    <div className="login-form-container">
      <h1 className="login-title">Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email <span className="required-asterisk">*</span>
          </label>
          <input
            type="email"
            id="email"
            className={`form-input ${emailError ? 'form-input-error' : ''}`}
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            required
          />
          <div className="field-error-container">
            {emailError && <div className="field-error">{emailError}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password <span className="required-asterisk">*</span>
          </label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="field-error-container">
            {/* Reserved space for potential password error */}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="sign-in-button" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
        >
          <svg
            className="google-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H15.9564C17.4382 14.2527 18.22 12.1455 18.22 9.20454H17.64Z"
              fill="#4285F4"
            />
            <path
              d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65455 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.57955C10.3218 3.57955 11.5077 4.03364 12.4409 4.92545L15.0218 2.34455C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65455 3.57955 9 3.57955Z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>

        <div className="form-links">
          <p className="form-link-text">
            Don't have account yet?{' '}
            <Link href="/signup" className="form-link">
              Create Account
            </Link>
          </p>
          <Link href="/forgot-password" className="form-link">
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

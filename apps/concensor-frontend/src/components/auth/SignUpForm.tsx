'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import './SignUpForm.css';

const SignUpForm = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.signup({ email, password, username });
      // TODO: Store token and redirect
      console.log('Signup successful:', response);
      router.push('/'); // Redirect to home page after signup
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please check your information.');
    } finally {
      setLoading(false);
    }
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
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Clear error when user starts typing again if email becomes valid
    if (emailError && emailTouched) {
      if (validateEmail(newEmail)) {
        setEmailError('');
      } else {
        setEmailError('Invalid email format! Please check again');
      }
    }
  };

  const handleUsernameCheck = () => {
    setUsernameTouched(true);
    // TODO: Implement username availability check
    console.log('Checking username:', username);
  };

  const handleEmailCheck = () => {
    setEmailTouched(true);
    if (email && !validateEmail(email)) {
      setEmailError('Invalid email format! Please check again');
    } else if (email) {
      // TODO: Implement email availability check
      console.log('Checking email:', email);
      setEmailError('');
    }
  };

  const validatePassword = (passwordValue: string): boolean => {
    if (passwordValue.length < 12) {
      return false;
    }
    if (!/[A-Z]/.test(passwordValue)) {
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue)) {
      return false;
    }
    return true;
  };

  const getPasswordErrorMessage = (passwordValue: string): string => {
    if (passwordValue.length < 12) {
      return 'Password must be at least 12 characters';
    }
    if (!/[A-Z]/.test(passwordValue)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue)) {
      return 'Password must contain at least one symbol';
    }
    return '';
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (password && !validatePassword(password)) {
      setPasswordError(getPasswordErrorMessage(password));
    } else {
      setPasswordError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Clear error when user starts typing again if password becomes valid
    if (passwordError && passwordTouched) {
      if (validatePassword(newPassword)) {
        setPasswordError('');
      } else {
        setPasswordError(getPasswordErrorMessage(newPassword));
      }
    }
    
    // Check if confirm password matches
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordTouched(true);
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    if (confirmPasswordError && confirmPasswordTouched) {
      if (newConfirmPassword === password) {
        setConfirmPasswordError('');
      } else {
        setConfirmPasswordError('Passwords do not match');
      }
    }
    
    // Also validate in real-time if password exists
    if (password && newConfirmPassword) {
      if (newConfirmPassword !== password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  return (
    <div className="signup-form-container">
      <h1 className="signup-title">Create Account</h1>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="username" className="form-label">
              User Name <span className="required-asterisk">*</span>
            </label>
            <button
              type="button"
              className="check-button"
              onClick={handleUsernameCheck}
            >
              Check
            </button>
          </div>
          <input
            type="text"
            id="username"
            className={`form-input ${usernameError ? 'form-input-error' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="field-error-container">
            {usernameError && <div className="field-error">{usernameError}</div>}
          </div>
        </div>

        <div className="form-group">
          <div className="label-row">
            <label htmlFor="email" className="form-label">
              Email <span className="required-asterisk">*</span>
            </label>
            <button
              type="button"
              className="check-button"
              onClick={handleEmailCheck}
            >
              Check
            </button>
          </div>
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
            className={`form-input ${passwordError ? 'form-input-error' : ''}`}
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            required
          />
          <div className="field-error-container">
            {passwordError && <div className="field-error">{passwordError}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password <span className="required-asterisk">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            className={`form-input ${confirmPasswordError ? 'form-input-error' : ''}`}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={handleConfirmPasswordBlur}
            required
          />
          <div className="field-error-container">
            {confirmPasswordError && <div className="field-error">{confirmPasswordError}</div>}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="create-account-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="form-links">
          <p className="form-link-text">
            Already have an account?{' '}
            <Link href="/login" className="form-link">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;

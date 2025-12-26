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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Validate all fields before submission
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear only format/required errors, but preserve conflict errors (username/email already exists)
    // This ensures that if email/username conflict was detected, it stays visible even when other errors occur
    
    // Only clear username error if it's not a conflict error
    if (usernameError && !usernameError.toLowerCase().includes('been used')) {
      setUsernameError('');
    }
    
    // Only clear email error if it's not a conflict error
    if (emailError && !emailError.toLowerCase().includes('been registered')) {
      setEmailError('');
    }
    
    // Always clear password errors (they're format/validation errors, not conflicts)
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      setUsernameTouched(true);
      isValid = false;
    } else if (usernameError && !usernameError.toLowerCase().includes('been used')) {
      // Only validate format if there's no conflict error
      // Format validation is already done in handleUsernameCheck
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      setEmailTouched(true);
      isValid = false;
    } else if (!validateEmail(email)) {
      // Only set format error if there's no conflict error
      if (!emailError || !emailError.toLowerCase().includes('been registered')) {
        setEmailError('Invalid email format! Please check again');
        setEmailTouched(true);
        isValid = false;
      }
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      setPasswordTouched(true);
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError(getPasswordErrorMessage(password));
      setPasswordTouched(true);
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm password');
      setConfirmPasswordTouched(true);
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      setConfirmPasswordTouched(true);
      isValid = false;
    }

    return isValid;
  };

  // Check both username and email availability in parallel
  const checkUsernameAndEmailAvailability = async (): Promise<boolean> => {
    const promises: Promise<{ type: 'username' | 'email'; available: boolean; message?: string } | null>[] = [];

    // Check username if it's filled and valid format
    if (username.trim() && 
        username.trim().length >= 3 && 
        username.trim().length <= 30 && 
        /^[a-zA-Z0-9_]+$/.test(username.trim())) {
      promises.push(
        api.checkUsername(username.trim())
          .then((usernameResult) => ({
            type: 'username' as const,
            available: usernameResult.available,
            message: usernameResult.message,
          }))
          .catch((err: any) => {
            // If check fails, don't block submission (backend will catch it)
            console.error('Username check error:', err);
            return null;
          })
      );
    }

    // Check email if it's filled and valid format
    if (email.trim() && validateEmail(email.trim())) {
      promises.push(
        api.checkEmail(email.trim())
          .then((emailResult) => ({
            type: 'email' as const,
            available: emailResult.available,
            message: emailResult.message,
          }))
          .catch((err: any) => {
            // If check fails, don't block submission (backend will catch it)
            console.error('Email check error:', err);
            return null;
          })
      );
    }

    // Wait for all checks to complete in parallel
    const results = await Promise.all(promises);

    // Process all results together and update state simultaneously
    let hasErrors = false;
    
    for (const result of results) {
      if (!result) continue; // Skip failed checks
      
      if (result.type === 'username') {
        if (!result.available) {
          setUsernameError(result.message || 'Username has been used');
          setUsernameTouched(true);
          setUsernameAvailable(false);
          hasErrors = true;
        } else {
          // Only clear error if it was a conflict error
          if (usernameError && usernameError.toLowerCase().includes('been used')) {
            setUsernameError('');
          }
          setUsernameAvailable(true);
        }
      } else if (result.type === 'email') {
        if (!result.available) {
          setEmailError(result.message || 'Email has been registered, Please login');
          setEmailTouched(true);
          setEmailAvailable(false);
          hasErrors = true;
        } else {
          // Only clear error if it was a conflict error
          if (emailError && emailError.toLowerCase().includes('been registered')) {
            setEmailError('');
          }
          setEmailAvailable(true);
        }
      }
    }

    return !hasErrors; // Return true if no errors found
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Step 1: Validate all frontend fields first (format, required, password match, etc.)
    const isFormValid = validateForm();
    
    // Step 2: Only check username/email availability if frontend validation passes
    // This prevents unnecessary API calls when form has basic validation errors
    // UX: User fixes frontend errors first, then we check availability
    if (!isFormValid) {
      return; // Stop here if frontend validation fails - don't check username/email yet
    }
    
    // Step 3: If frontend validation passes, check username and email availability
    setCheckingAvailability(true);
    const areUsernameAndEmailAvailable = await checkUsernameAndEmailAvailability();
    setCheckingAvailability(false);
    
    // Step 4: Stop submission if username/email are not available
    if (!areUsernameAndEmailAvailable) {
      return; // Stop submission if username/email are not available
    }

    setLoading(true);

    try {
      const response = await api.signup({ email, password, username });
      console.log('Signup successful:', response);
      router.push('/home'); // Redirect to posts page after signup
    } catch (err: any) {
      const errorMessage = err.message || 'Sign up failed. Please check your information.';
      
      // Handle specific backend errors (fallback in case checks didn't catch it)
      // Check for username conflict
      if (errorMessage.toLowerCase().includes('username') && 
          (errorMessage.toLowerCase().includes('already') || 
           errorMessage.toLowerCase().includes('used') ||
           errorMessage.toLowerCase().includes('exists'))) {
        setUsernameError('Username has been used');
        setUsernameTouched(true);
        setUsernameAvailable(false); // Make check button red
        setError(''); // Clear form-level error
      } 
      // Check for email conflict
      else if (errorMessage.toLowerCase().includes('email') && 
               (errorMessage.toLowerCase().includes('registered') || 
                errorMessage.toLowerCase().includes('already') ||
                errorMessage.toLowerCase().includes('exists'))) {
        setEmailError('Email has been registered, Please login');
        setEmailTouched(true);
        setEmailAvailable(false); // Make check button red
        setError(''); // Clear form-level error
      } else {
        setError(errorMessage);
      }
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
    // Clear error and availability status when user starts typing
    if (emailError && emailTouched) {
      // Clear all errors when user types (including conflict errors)
      if (emailError.toLowerCase().includes('been registered')) {
        // Clear conflict error when user types
        setEmailError('');
        setEmailAvailable(null);
      } else {
        // Clear format errors when user types
        if (validateEmail(newEmail)) {
          setEmailError('');
        } else {
          setEmailError('Invalid email format! Please check again');
        }
        setEmailAvailable(null); // Reset availability status when user types
      }
    } else {
      setEmailAvailable(null); // Reset availability status when user types
    }
  };

  const handleUsernameCheck = async () => {
    setUsernameTouched(true);
    
    // Validate username format first
    if (!username.trim()) {
      setUsernameError('Username is required');
      setUsernameAvailable(null);
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 30) {
      setUsernameError('Username must be 3-30 characters');
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(null);
      return;
    }

    // Clear previous error
    setUsernameError('');
    setCheckingUsername(true);

    try {
      const result = await api.checkUsername(username.trim());
      if (result.available) {
        setUsernameAvailable(true);
        setUsernameError('');
      } else {
        setUsernameAvailable(false);
        setUsernameError(result.message || 'Username has been used');
      }
    } catch (err: any) {
      setUsernameAvailable(null);
      setUsernameError(err.message || 'Failed to check username availability');
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleEmailCheck = async () => {
    setEmailTouched(true);
    
    // Validate email format first
    if (!email.trim()) {
      setEmailError('Email is required');
      setEmailAvailable(null);
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email format! Please check again');
      setEmailAvailable(null);
      return;
    }

    // Clear previous error
    setEmailError('');
    setCheckingEmail(true);

    try {
      const result = await api.checkEmail(email.trim());
      if (result.available) {
        setEmailAvailable(true);
        setEmailError('');
      } else {
        setEmailAvailable(false);
        setEmailError(result.message || 'Email has been registered, Please login');
      }
    } catch (err: any) {
      setEmailAvailable(null);
      setEmailError(err.message || 'Failed to check email availability');
    } finally {
      setCheckingEmail(false);
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
              className={`check-button ${
                usernameAvailable === true 
                  ? 'check-button-success' 
                  : usernameAvailable === false 
                  ? 'check-button-error' 
                  : ''
              }`}
              onClick={handleUsernameCheck}
              disabled={checkingUsername || !username.trim()}
            >
              {checkingUsername ? (
                <>
                  <span className="spinner spinner-small"></span>
                  Checking...
                </>
              ) : usernameAvailable === true ? (
                <>
                  <span className="check-icon">✓</span> Check
                </>
              ) : (
                'Check'
              )}
            </button>
          </div>
          <input
            type="text"
            id="username"
            className={`form-input ${usernameError ? 'form-input-error' : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              // Clear error and availability status when user starts typing
              // But preserve conflict errors (username already used) until user checks again
              if (usernameError) {
                // Only clear format errors, not conflict errors
                if (usernameError.toLowerCase().includes('been used')) {
                  // Clear conflict error when user types (same as email behavior)
                  setUsernameError('');
                  setUsernameAvailable(null); // Reset availability status so user can check again
                } else {
                  // Clear format errors when user types
                  setUsernameError('');
                  setUsernameAvailable(null); // Reset availability status when user types
                }
              } else {
                setUsernameAvailable(null); // Reset availability status when user types
              }
            }}
            onBlur={() => {
              setUsernameTouched(true);
              if (!username.trim()) {
                setUsernameError('Username is required');
              }
            }}
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
              className={`check-button ${
                emailAvailable === true 
                  ? 'check-button-success' 
                  : emailAvailable === false 
                  ? 'check-button-error' 
                  : ''
              }`}
              onClick={handleEmailCheck}
              disabled={checkingEmail || !email.trim()}
            >
              {checkingEmail ? (
                <>
                  <span className="spinner spinner-small"></span>
                  Checking...
                </>
              ) : emailAvailable === true ? (
                <>
                  <span className="check-icon">✓</span> Check
                </>
              ) : (
                'Check'
              )}
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

        <button type="submit" className="create-account-button" disabled={loading || checkingAvailability}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Creating Account...
            </>
          ) : checkingAvailability ? (
            <>
              <span className="spinner"></span>
              Checking Availability...
            </>
          ) : (
            'Create Account'
          )}
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

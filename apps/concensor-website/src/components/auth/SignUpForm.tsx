'use client';

import Link from 'next/link';
import { useSignUpForm } from './useSignUpForm';
import './SignUpForm.css';

const SignUpForm = () => {
  // Use custom hook to manage all form state and logic
  const {
    // Form values
    username,
    email,
    password,
    confirmPassword,
    
    // Form state
    error,
    loading,
    
    // Field errors
    usernameError,
    emailError,
    passwordError,
    confirmPasswordError,
    
    // Availability states
    usernameAvailable,
    emailAvailable,
    checkingUsername,
    checkingEmail,
    checkingAvailability,
    
    // Handlers
    handleSubmit,
    handleUsernameChange,
    handleUsernameBlur,
    handleUsernameCheck,
    handleEmailChange,
    handleEmailBlur,
    handleEmailCheck,
    handlePasswordChange,
    handlePasswordBlur,
    handleConfirmPasswordChange,
    handleConfirmPasswordBlur,
  } = useSignUpForm();

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
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
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

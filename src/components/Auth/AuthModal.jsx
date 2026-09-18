import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authModalReason } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal} aria-modal="true" role="dialog">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close modal"
          id="auth-modal-close-btn"
        >
          ✕
        </button>

        <div className="auth-modal-header">
          <img
            src="/favicon.svg"
            alt="Flowstate"
            className="auth-modal-logo"
          />
          <h2 className="auth-modal-title">Continue to Flowstate</h2>
          <p className="auth-modal-desc">
            {authModalReason || 'Sign in with Google to sync your study sessions, tasks, and streaks across devices.'}
          </p>
        </div>

        <div className="auth-modal-action">
          <GoogleSignInButton size="lg" />
        </div>

        <p className="auth-modal-footer">
          Fast one-click sign in · Your data stays private
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

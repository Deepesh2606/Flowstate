import React, { useState, useEffect } from 'react';
import { IconX } from '../Icons';

export const IconShield = ({ size = 18, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IconFileText = ({ size = 18, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconRefreshCcw = ({ size = 18, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <polyline points="1 4 1 10 7 10" />
    <polyline points="23 20 23 14 17 14" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
  </svg>
);

const LegalModal = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="legal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="legal-modal-header">
          <div className="legal-modal-title-wrap">
            <h2 className="legal-modal-title">Legal & Policies</h2>
            <span className="legal-modal-subtitle">Last updated: September 2026</span>
          </div>
          <button
            type="button"
            className="legal-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="legal-modal-tabs">
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <IconShield size={16} />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <IconFileText size={16} />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            className={`legal-tab-btn ${activeTab === 'refund' ? 'active' : ''}`}
            onClick={() => setActiveTab('refund')}
          >
            <IconRefreshCcw size={16} />
            <span>Refund Policy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="legal-modal-content">
          {activeTab === 'privacy' && (
            <div className="legal-article">
              <h3>Privacy Policy</h3>
              <p>
                Welcome to <strong>FMOOD</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
                Your privacy is of paramount importance to us. This Privacy Policy outlines how we collect, use, protect, and handle your personal information when you use our web application and services.
              </p>

              <h4>1. Information We Collect</h4>
              <ul>
                <li>
                  <strong>Account Information:</strong> When you sign in using Google Authentication, we receive your name, email address, and profile photo provided by Google.
                </li>
                <li>
                  <strong>Productivity & Usage Data:</strong> Your focus sessions, study durations, completed tasks, notes, leaderboard stats, and custom settings are stored to sync your experience across devices.
                </li>
                <li>
                  <strong>Guest Mode (Local Data):</strong> If you choose to use Fmood without signing in, your data (timers, tasks, settings, local notes) is stored entirely locally on your device via browser <code>localStorage</code> and IndexedDB.
                </li>
                <li>
                  <strong>Media & Uploads:</strong> If you upload custom wallpapers or video backgrounds, files are processed via Cloudinary in accordance with their privacy and storage standards.
                </li>
                <li>
                  <strong>AI Chat Data:</strong> Questions and prompts sent to the Fmood AI assistant are processed securely by Google Gemini API to generate contextual study advice. We do not sell or monetize your chat queries.
                </li>
              </ul>

              <h4>2. How We Use Your Information</h4>
              <ul>
                <li>To provide, operate, maintain, and improve the Fmood study tracker.</li>
                <li>To synchronize your study progress, history, and streaks across devices.</li>
                <li>To display anonymous or pseudonymized study leaderboards if enabled.</li>
                <li>To communicate product updates, support responses, or security alerts.</li>
              </ul>

              <h4>3. Data Protection & Security</h4>
              <p>
                We implement industry-standard security measures, including HTTPS encryption in transit, Firebase Firestore security rules, and authenticated user isolation. We never sell, rent, or trade your personal data to third-party data brokers or advertising networks.
              </p>

              <h4>4. Third-Party Services</h4>
              <p>Fmood relies on vetted third-party service providers for core functionality:</p>
              <ul>
                <li><strong>Google Firebase:</strong> Authentication, Firestore database, and hosting.</li>
                <li><strong>Google Gemini API:</strong> AI study assistant and flashcard generation.</li>
                <li><strong>Cloudinary:</strong> Image and video wallpaper CDN.</li>
                <li><strong>Spotify / Apple Music / YouTube:</strong> Embedded web players operate under their respective privacy policies.</li>
              </ul>

              <h4>5. Your Rights & Data Deletion</h4>
              <p>
                You retain full ownership of your data. You may request account deletion and complete erasure of all associated study logs, notes, and cloud data at any time by contacting us at <a href="mailto:support@fmood.study">support@fmood.study</a> or via the Account settings tab.
              </p>

              <h4>6. Cookies & Tracking</h4>
              <p>
                We use essential cookies and browser storage tokens solely to maintain your active authentication session and save your aesthetic preferences (themes, audio volume, clock styles).
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="legal-article">
              <h3>Terms of Service</h3>
              <p>
                By accessing or using <strong>FMOOD</strong>, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue using the service.
              </p>

              <h4>1. Use of Service</h4>
              <p>
                FMOOD provides productivity, time-tracking, ambient audio, and AI-assisted study tools. You are granted a non-exclusive, non-transferable, revocable license to access and use the platform for personal, non-commercial, or educational purposes.
              </p>

              <h4>2. User Accounts</h4>
              <ul>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You agree not to impersonate others, abuse public leaderboards, or upload malicious files.</li>
                <li>We reserve the right to suspend accounts that violate acceptable use or attempt to exploit the platform.</li>
              </ul>

              <h4>3. Acceptable Use Policy</h4>
              <p>When using FMOOD, you agree not to:</p>
              <ul>
                <li>Reverse-engineer, scrape, or automate abusive requests to our APIs or third-party AI services.</li>
                <li>Upload unlawful, defamatory, or copyright-infringing wallpapers, audio, or media.</li>
                <li>Attempt to bypass rate limits, feature gates, or authentication systems.</li>
              </ul>

              <h4>4. Intellectual Property</h4>
              <p>
                The FMOOD interface, branding, custom code, UI designs, and soundscape integrations are the intellectual property of FMOOD. All third-party trademarks (including Spotify, Apple Music, YouTube, and Google) belong to their respective owners.
              </p>

              <h4>5. Disclaimer of Warranties</h4>
              <p>
                FMOOD is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely immune to data loss. Always keep backups of critical academic work.
              </p>

              <h4>6. Limitation of Liability</h4>
              <p>
                To the maximum extent permitted by applicable law, FMOOD and its creators shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of or inability to use the service.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="legal-article">
              <h3>Refund &amp; Cancellation Policy</h3>
              <p>
                We want you to be completely satisfied with <strong>FMOOD</strong>. We take pride in building a world-class focus environment, and we stand behind our software with fair and transparent terms.
              </p>

              <h4>1. 14-Day Money-Back Guarantee</h4>
              <p>
                If you purchase <strong>Fmood Pro</strong> (Lifetime License or Annual Subscription) and find that it does not fit your workflow, you are eligible for a <strong>100% full refund within 14 calendar days</strong> of your initial purchase date—no questions asked.
              </p>

              <h4>2. How to Request a Refund</h4>
              <p>
                To claim a refund within the 14-day window:
              </p>
              <ol>
                <li>Send an email to <a href="mailto:support@fmood.study">support@fmood.study</a> with the subject line <em>&ldquo;Refund Request&rdquo;</em>.</li>
                <li>Include your account email address and payment receipt/order number.</li>
                <li>Our team will process your refund within 2 to 3 business days. Funds typically return to your original payment method within 5–10 business days.</li>
              </ol>

              <h4>3. Subscription Cancellations</h4>
              <p>
                If you are on a recurring monthly or annual billing plan:
              </p>
              <ul>
                <li>You can cancel your subscription at any time with a single click in your Account settings or via the billing portal link in your receipt.</li>
                <li>Upon cancellation, your Pro features remain fully active until the end of your current billing period. You will never be charged again.</li>
              </ul>

              <h4>4. Free Trial &amp; Free Tier</h4>
              <p>
                Fmood provides a generous Free tier that allows you to experience the core Pomodoro timer, ambient sounds, and productivity tools with zero commitment or payment required.
              </p>

              <h4>5. Chargebacks &amp; Support</h4>
              <p>
                If you experience any billing discrepancies, please reach out to us at <a href="mailto:support@fmood.study">support@fmood.study</a> first so we can promptly resolve the issue directly for you.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="legal-modal-footer">
          <div className="legal-modal-contact">
            Need help? Contact us at <a href="mailto:support@fmood.study">support@fmood.study</a>
          </div>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;

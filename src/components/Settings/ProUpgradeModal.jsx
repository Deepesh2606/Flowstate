import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { IconX, IconStar } from '../Icons';

export const ProUpgradeModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // The developer (user) should replace this with their actual Razorpay Payment Link
  const RAZORPAY_PAYMENT_LINK = 'https://rzp.io/l/YOUR_PAYMENT_LINK_ID'; 

  const handleUpgradeClick = () => {
    // Ideally, open the payment link
    window.open(RAZORPAY_PAYMENT_LINK, '_blank');
    
    // For testing/demonstration, we'll auto-upgrade after 2 seconds
    // In production, this should happen via webhook or manual verification
    setLoading(true);
    setTimeout(() => {
      updateSettings({ isPro: true });
      setLoading(false);
      onClose();
      alert('Success! You are now a PRO user. (This is a mock success for testing)');
    }, 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content pro-modal-content">
        <button className="modal-close" onClick={onClose}>
          <IconX size={20} />
        </button>

        <div className="pro-header">
          <IconStar size={48} color="#fbbf24" />
          <h2>Unlock Flowstate PRO</h2>
          <p>Supercharge your focus with premium features.</p>
        </div>

        <ul className="pro-features-list">
          <li>✨ <strong>Custom Wallpapers:</strong> Upload your own images and video backgrounds.</li>
          <li>📊 <strong>Advanced Analytics:</strong> Get detailed insights and access the global leaderboard.</li>
          <li>🎯 <strong>Unlimited Targets:</strong> Create unlimited study targets and exams.</li>
          <li>🎵 <strong>More Chimes & Sounds:</strong> Unlock the full library of focus sounds.</li>
        </ul>

        <div className="pro-actions">
          <button 
            className="pro-upgrade-btn" 
            onClick={handleUpgradeClick}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade Now - ₹299 (UPI Supported)'}
          </button>
          <p className="pro-footer-text">
            Payments are securely processed via Razorpay. Supports UPI, Cards, Netbanking, and Wallets.
          </p>
        </div>
      </div>

      <style>{`
        .pro-modal-content {
          max-width: 400px;
          text-align: center;
          padding: 32px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid #334155;
          position: relative;
        }
        .pro-header {
          margin-bottom: 24px;
        }
        .pro-header h2 {
          margin: 16px 0 8px;
          font-family: var(--font-display);
          color: #fff;
        }
        .pro-header p {
          color: #94a3b8;
          font-size: 14px;
        }
        .pro-features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          text-align: left;
        }
        .pro-features-list li {
          margin-bottom: 12px;
          font-size: 14px;
          color: #cbd5e1;
        }
        .pro-features-list strong {
          color: #f8fafc;
        }
        .pro-upgrade-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          background: #fbbf24;
          color: #78350f;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        .pro-upgrade-btn:hover:not(:disabled) {
          background: #f59e0b;
          transform: translateY(-2px);
        }
        .pro-upgrade-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .pro-footer-text {
          margin-top: 16px;
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default ProUpgradeModal;

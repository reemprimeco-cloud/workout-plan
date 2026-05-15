// InAppNotificationPopup — shows unread in-app notifications as a modal popup
// Auto-fetches on mount, shows one notification at a time, marks as read on close
import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';

export default function InAppNotificationPopup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const unreadQuery = trpc.inAppNotifications.getUnread.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const markReadMutation = trpc.inAppNotifications.markRead.useMutation({
    onSuccess: () => unreadQuery.refetch(),
  });

  const notifications = unreadQuery.data ?? [];
  const current = notifications[currentIndex];

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrentIndex(0);
      setVisible(true);
    }
  }, [notifications.length]);

  const handleClose = () => {
    if (current) {
      markReadMutation.mutate({ notificationId: current.id });
    }
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setVisible(false);
    }
  };

  if (!visible || !current) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 30, 61, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={{
        background: 'white',
        borderRadius: 24,
        width: '100%',
        maxWidth: 420,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(27,46,94,0.35)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: 'Cairo, sans-serif' }}>
              {current.title}
            </span>
          </div>
          {notifications.length > 1 && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}>
              {currentIndex + 1} / {notifications.length}
            </span>
          )}
        </div>

        {/* Optional image/banner */}
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt="notification banner"
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{
            color: '#334155',
            fontSize: 14,
            lineHeight: 1.7,
            margin: '0 0 20px',
            fontFamily: 'Cairo, sans-serif',
            whiteSpace: 'pre-wrap',
          }}>
            {current.message}
          </p>

          {/* CTA button */}
          {current.ctaText && current.ctaLink && (
            <a
              href={current.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              style={{
                display: 'block',
                textAlign: 'center',
                background: `linear-gradient(135deg, ${NAVY}, ${NAVY_DARK})`,
                color: 'white',
                textDecoration: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 12,
                fontFamily: 'Cairo, sans-serif',
              }}
            >
              {current.ctaText} →
            </a>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              background: 'none',
              border: `2px solid ${SKY}`,
              borderRadius: 12,
              padding: '11px 20px',
              color: NAVY,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            {currentIndex < notifications.length - 1
              ? (notifications.length > 1 ? `التالي (${notifications.length - currentIndex - 1} متبقي)` : 'Next')
              : '✓ إغلاق'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

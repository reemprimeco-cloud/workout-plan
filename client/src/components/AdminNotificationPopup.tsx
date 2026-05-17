/**
 * AdminNotificationPopup
 * Polls for unread admin-sent in-app notifications and shows them as
 * a modal popup (one at a time). Closing marks the notification as read.
 */
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const NAVY = '#1B2E5E';
const NAVY_DARK = '#0F1E3D';
const SKY = '#7BB8D4';

export default function AdminNotificationPopup() {
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<number[]>([]);

  const { data: notifications, refetch } = trpc.admin.getUnreadNotifications.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000, // poll every 60 seconds
    staleTime: 30_000,
  });

  const markReadMutation = trpc.admin.markNotificationRead.useMutation({
    onSuccess: () => refetch(),
  });

  // Filter out already-dismissed ones (optimistic)
  const pending = (notifications ?? []).filter((n) => !dismissed.includes(n.id));
  const current = pending[currentIndex] ?? null;

  // Reset index when notifications change
  useEffect(() => {
    setCurrentIndex(0);
  }, [notifications?.length]);

  if (!current) return null;

  const handleClose = () => {
    setDismissed((prev) => [...prev, current.id]);
    markReadMutation.mutate({ notificationId: current.id });
    setCurrentIndex(0);
  };

  const handleCta = () => {
    if (current.ctaLink) window.open(current.ctaLink, '_blank', 'noopener');
    handleClose();
  };

  // Detect language from document direction
  const isRTL = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';
  const title = isRTL && current.titleAr ? current.titleAr : current.title;
  const message = isRTL && current.messageAr ? current.messageAr : current.message;
  const ctaText = isRTL && current.ctaTextAr ? current.ctaTextAr : current.ctaText;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15, 30, 61, 0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: '90%', maxWidth: 420,
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(15,30,61,0.35)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header bar */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
          padding: '16px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: SKY, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Prime Fit
          </span>
          <button
            onClick={handleClose}
            aria-label="Close notification"
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', fontSize: 16, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Optional image */}
        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt=""
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px 24px', direction: isRTL ? 'rtl' : 'ltr' }}>
          <h3 style={{
            margin: '0 0 10px', color: NAVY, fontSize: 17, fontWeight: 900,
            lineHeight: 1.3,
          }}>
            {title}
          </h3>
          <p style={{
            margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {message}
          </p>

          {/* CTA + Close buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            {ctaText && current.ctaLink && (
              <button
                onClick={handleCta}
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${NAVY_DARK}, ${NAVY})`,
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '12px 20px', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {ctaText}
              </button>
            )}
            <button
              onClick={handleClose}
              style={{
                flex: ctaText && current.ctaLink ? 0 : 1,
                background: '#F1F5F9', color: '#475569',
                border: '1.5px solid #E2E8F0', borderRadius: 12,
                padding: '12px 20px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                minWidth: 80,
              }}
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </button>
          </div>

          {/* Indicator dots if multiple */}
          {pending.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              {pending.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentIndex ? 18 : 6, height: 6,
                    borderRadius: 3,
                    background: i === currentIndex ? NAVY : '#CBD5E1',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translate(-50%, -40%); opacity: 0 } to { transform: translate(-50%, -50%); opacity: 1 } }
      `}</style>
    </>
  );
}

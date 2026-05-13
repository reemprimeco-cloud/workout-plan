/**
 * NotificationBell — live badge icon shown in the Community header.
 * Shows unread count, opens a drawer with the notification list.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useSocket } from "../contexts/SocketContext";

const NAVY     = "#0D1B2A";
const CYAN     = "#00E5FF";
const ORANGE   = "#FF6B35";
const CARD_BG  = "#111827";
const CARD_BG2 = "#1F2937";
const TEXT_MAIN = "#F9FAFB";
const TEXT_SUB  = "#9CA3AF";

function timeAgo(date: Date | string, lang = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)  return lang === "ar" ? "الآن" : "just now";
  if (diff < 3600) return lang === "ar" ? `${Math.floor(diff/60)} د` : `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return lang === "ar" ? `${Math.floor(diff/3600)} س` : `${Math.floor(diff/3600)}h ago`;
  return lang === "ar" ? `${Math.floor(diff/86400)} ي` : `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationBell({ lang = "en" }: { lang?: string }) {
  const [open, setOpen] = useState(false);
  const { unreadCount, clearUnread, latestNotification } = useSocket();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const { data: notifications, refetch } = trpc.community.getNotifications.useQuery(undefined, {
    enabled: open,
  });
  const markRead = trpc.community.markNotificationsRead.useMutation({
    onSuccess: () => { clearUnread(); refetch(); },
  });

  // Show toast on new notification
  useEffect(() => {
    if (!latestNotification) return;
    setToastMsg(latestNotification.message);
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, [latestNotification]);

  const handleOpen = () => {
    setOpen(true);
    if (unreadCount > 0) markRead.mutate();
  };

  return (
    <>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: 6, color: TEXT_MAIN, fontSize: 22,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: ORANGE, color: "white",
            borderRadius: "50%", fontSize: 10, fontWeight: 800,
            width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${NAVY}`,
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Toast popup */}
      {showToast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: CARD_BG, border: `1px solid ${CYAN}44`,
          borderRadius: 12, padding: "10px 16px",
          color: TEXT_MAIN, fontSize: 13, fontWeight: 600,
          boxShadow: `0 4px 20px rgba(0,0,0,0.6)`,
          zIndex: 1000, maxWidth: 320, textAlign: "center",
          animation: "slideDown 0.3s ease",
        }}>
          {toastMsg}
        </div>
      )}

      {/* Notification drawer */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: 0, right: 0,
              width: "min(100vw, 360px)", height: "100vh",
              background: NAVY, overflowY: "auto",
              borderLeft: `1px solid ${CYAN}22`,
              animation: "slideInRight 0.25s ease",
              direction: lang === "ar" ? "rtl" : "ltr",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px", borderBottom: `1px solid ${CARD_BG2}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: NAVY, zIndex: 1,
            }}>
              <span style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 16 }}>
                🔔 {lang === "ar" ? "الإشعارات" : "Notifications"}
              </span>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", color: TEXT_SUB,
                fontSize: 20, cursor: "pointer",
              }}>✕</button>
            </div>

            {/* List */}
            <div style={{ padding: 12 }}>
              {!notifications || notifications.length === 0 ? (
                <div style={{ color: TEXT_SUB, textAlign: "center", padding: 32, fontSize: 14 }}>
                  {lang === "ar" ? "لا توجد إشعارات بعد" : "No notifications yet"}
                </div>
              ) : notifications.map((n: any) => (
                <div key={n.id} style={{
                  background: n.isRead ? CARD_BG : `${CYAN}11`,
                  border: `1px solid ${n.isRead ? CARD_BG2 : CYAN + "33"}`,
                  borderRadius: 12, padding: "10px 14px", marginBottom: 8,
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {n.type === "like" ? "❤️" : n.type === "cheer" ? "💪" : n.type === "fire" ? "🔥" : n.type === "comment" ? "💬" : "⭐"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: TEXT_MAIN, fontSize: 13, margin: "0 0 4px", lineHeight: 1.4 }}>
                      {lang === "ar" ? n.message : (n.messageEn ?? n.message)}
                    </p>
                    <span style={{ color: TEXT_SUB, fontSize: 11 }}>
                      {timeAgo(n.createdAt, lang)}
                    </span>
                  </div>
                  {!n.isRead && (
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: CYAN, flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}

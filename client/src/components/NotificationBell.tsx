/**
 * NotificationBell — modern Instagram/X-style notification panel
 * White background, grouped by date (Today / Yesterday / Earlier),
 * click-to-navigate, individual mark-read, delete, unread badge.
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useSocket } from "../contexts/SocketContext";
import {
  Bell, Heart, MessageCircle, UserPlus, AtSign,
  Flame, Zap, X, CheckCheck, Trash2,
} from "lucide-react";

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function groupByDate(notifications: any[]): { label: string; items: any[] }[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups["Today"].push(n);
    else if (d.getTime() === yesterday.getTime()) groups["Yesterday"].push(n);
    else groups["Earlier"].push(n);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function getNotifIcon(type: string) {
  const s = { width: 16, height: 16 };
  switch (type) {
    case "like":    return <Heart {...s} style={{ color: "#EF4444" }} />;
    case "cheer":   return <Zap {...s} style={{ color: "#F59E0B" }} />;
    case "fire":    return <Flame {...s} style={{ color: "#F97316" }} />;
    case "comment": return <MessageCircle {...s} style={{ color: "#3B82F6" }} />;
    case "reply":   return <MessageCircle {...s} style={{ color: "#8B5CF6" }} />;
    case "follow":  return <UserPlus {...s} style={{ color: "#10B981" }} />;
    case "mention": return <AtSign {...s} style={{ color: "#06B6D4" }} />;
    case "message": return <MessageCircle {...s} style={{ color: "#1B2E5E" }} />;
    default:        return <Bell {...s} style={{ color: "#6B7280" }} />;
  }
}

function getNotifBg(type: string): string {
  switch (type) {
    case "like":    return "#FEF2F2";
    case "cheer":   return "#FFFBEB";
    case "fire":    return "#FFF7ED";
    case "comment": return "#EFF6FF";
    case "reply":   return "#F5F3FF";
    case "follow":  return "#ECFDF5";
    case "mention": return "#ECFEFF";
    case "message": return "#EFF6FF";
    default:        return "#F9FAFB";
  }
}

export default function NotificationBell({
  lang = "en",
  onNavigate,
}: {
  lang?: string;
  onNavigate?: (target: { type: string; postId?: number; userId?: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const { unreadCount, clearUnread, latestNotification, realtimeConnected } = useSocket();
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const { data: notifications, refetch } = trpc.community.getNotifications.useQuery(undefined, {
    enabled: open,
    // Poll only as a fallback when Realtime is unavailable.
    refetchInterval: open && !realtimeConnected ? 15_000 : false,
  });

  const markAllRead = trpc.community.markNotificationsRead.useMutation({
    onSuccess: () => { clearUnread(); refetch(); },
  });

  const markOneRead = trpc.community.markOneNotificationRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteNotif = trpc.community.deleteNotification.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    if (!latestNotification) return;
    setToastMsg((latestNotification as any).message ?? "New notification");
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, [latestNotification]);

  const handleNotifClick = useCallback((n: any) => {
    if (!n.isRead) markOneRead.mutate({ notifId: n.id });
    if (onNavigate) {
      if (n.postId) onNavigate({ type: "post", postId: n.postId });
      else if (n.type === "follow" && n.actorId) onNavigate({ type: "profile", userId: n.actorId });
      else if (n.type === "message") onNavigate({ type: "dm" });
    }
  }, [markOneRead, onNavigate]);

  const grouped = notifications ? groupByDate(notifications) : [];
  const localUnread = notifications?.filter((n: any) => !n.isRead).length ?? unreadCount;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: 6, display: "flex", alignItems: "center",
          justifyContent: "center", borderRadius: 8, color: "#1B2E5E",
        }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 22, height: 22 }} />
        {localUnread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#EF4444", color: "white",
            borderRadius: "50%", fontSize: 9, fontWeight: 800,
            width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
          }}>
            {localUnread > 9 ? "9+" : localUnread}
          </span>
        )}
      </button>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "white", border: "1px solid #E5E7EB",
          borderRadius: 12, padding: "10px 16px",
          color: "#111827", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 2000, maxWidth: 320, textAlign: "center",
          animation: "slideDown 0.3s ease",
        }}>
          {toastMsg}
        </div>
      )}

      {/* Drawer overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: 0, right: 0,
              width: "min(100vw, 380px)", height: "100vh",
              background: "white", overflowY: "auto",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
              animation: "slideInRight 0.25s ease",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid #F3F4F6",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "white", zIndex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell style={{ width: 20, height: 20, color: "#1B2E5E" }} />
                <span style={{ color: "#111827", fontWeight: 800, fontSize: 17 }}>
                  Notifications
                </span>
                {localUnread > 0 && (
                  <span style={{
                    background: "#EF4444", color: "white",
                    borderRadius: 20, fontSize: 11, fontWeight: 700,
                    padding: "1px 7px",
                  }}>
                    {localUnread}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {localUnread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    style={{
                      background: "#F0F4F8", border: "none", borderRadius: 8,
                      padding: "5px 10px", cursor: "pointer",
                      color: "#1B2E5E", fontSize: 12, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <CheckCheck style={{ width: 13, height: 13 }} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#6B7280", padding: 4, borderRadius: 6,
                    display: "flex", alignItems: "center",
                  }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {!notifications || notifications.length === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "60px 20px", gap: 12,
                }}>
                  <Bell style={{ width: 40, height: 40, color: "#D1D5DB" }} />
                  <p style={{ color: "#9CA3AF", fontSize: 14, margin: 0, textAlign: "center" }}>
                    No notifications yet
                  </p>
                  <p style={{ color: "#D1D5DB", fontSize: 12, margin: 0, textAlign: "center" }}>
                    When someone likes or comments on your posts, you will see it here
                  </p>
                </div>
              ) : grouped.map(group => (
                <div key={group.label}>
                  <div style={{
                    padding: "8px 16px 4px",
                    fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {group.label}
                  </div>
                  {group.items.map((n: any) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "10px 16px",
                        background: n.isRead ? "white" : "#F0F4F8",
                        cursor: "pointer",
                        borderBottom: "1px solid #F9FAFB",
                      }}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: getNotifBg(n.type),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {getNotifIcon(n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          color: "#111827", fontSize: 13, margin: "0 0 2px",
                          lineHeight: 1.4, fontWeight: n.isRead ? 400 : 600,
                        }}>
                          {n.message}
                        </p>
                        <span style={{ color: "#9CA3AF", fontSize: 11 }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                        {!n.isRead && (
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#1B2E5E",
                          }} />
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif.mutate({ notifId: n.id }); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#D1D5DB", padding: 3, borderRadius: 4,
                            display: "flex", alignItems: "center",
                          }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>
                  ))}
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

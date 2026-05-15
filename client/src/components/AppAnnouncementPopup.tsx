/**
 * AppAnnouncementPopup
 * Shows active announcements to ALL users on app open.
 * No sign-in required. Dismissed IDs stored in localStorage.
 * Slides up from bottom as a sheet. Multiple announcements = paginated.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

const STORAGE_KEY = "primefit_seen_announcements";

function getSeenIds(): number[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function markSeen(id: number) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, id]));
  }
}

export function AppAnnouncementPopup() {
  const { lang, isRTL } = useLanguage();
  const { data: announcements } = trpc.announcements.getActive.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const [queue, setQueue]     = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [idx, setIdx]         = useState(0);

  // On data load, filter out already-seen ones
  useEffect(() => {
    if (!announcements?.length) return;
    const seen = getSeenIds();
    const unseen = announcements.filter((a: any) => !seen.includes(a.id));
    if (unseen.length > 0) {
      setQueue(unseen);
      setIdx(0);
      // Small delay so app renders first
      setTimeout(() => setVisible(true), 600);
    }
  }, [announcements]);

  if (!visible || !queue.length) return null;

  const current = queue[idx];
  if (!current) return null;

  const title = lang === "ar" ? current.titleAr : current.titleEn;
  const body  = lang === "ar" ? current.bodyAr  : current.bodyEn;
  const ctaLabel = lang === "ar" ? current.ctaLabelAr : current.ctaLabelEn;

  const dismiss = () => {
    markSeen(current.id);
    if (idx < queue.length - 1) {
      setIdx(idx + 1);
    } else {
      setVisible(false);
    }
  };

  const handleCta = () => {
    markSeen(current.id);
    if (current.ctaUrl) window.open(current.ctaUrl, "_blank", "noopener");
    dismiss();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          animation: "fadeIn 0.25s ease",
        }}
      />

      {/* Sheet */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 99999,
          background: "#111827",
          borderRadius: "22px 22px 0 0",
          padding: "8px 0 40px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
          fontFamily: "Cairo, Tajawal, system-ui, sans-serif",
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: "#374151", margin: "12px auto 20px",
        }} />

        {/* Pagination dots */}
        {queue.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {queue.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === idx ? "#00E5FF" : "#374151",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "0 24px" }}>
          {/* Emoji */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "#1F2937",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, marginBottom: 16,
            margin: "0 auto 16px",
          }}>
            {current.emoji}
          </div>

          {/* Title */}
          <h2 style={{
            color: "#F9FAFB", fontSize: 20, fontWeight: 900,
            margin: "0 0 10px", textAlign: "center", lineHeight: 1.3,
          }}>
            {title}
          </h2>

          {/* Body */}
          <p style={{
            color: "#9CA3AF", fontSize: 14, lineHeight: 1.75,
            margin: "0 0 24px", textAlign: "center",
          }}>
            {body}
          </p>

          {/* CTA button */}
          {ctaLabel && current.ctaUrl && (
            <button onClick={handleCta} style={{
              width: "100%",
              background: "linear-gradient(135deg, #00E5FF, #0099BB)",
              color: "#0D1B2A", border: "none", borderRadius: 14,
              padding: "14px", fontSize: 15, fontWeight: 900,
              cursor: "pointer", marginBottom: 10,
              fontFamily: "inherit",
            }}>
              {ctaLabel} →
            </button>
          )}

          {/* Dismiss */}
          <button onClick={dismiss} style={{
            width: "100%",
            background: "transparent",
            border: "1.5px solid #1F2937",
            color: "#6B7280", borderRadius: 14,
            padding: "13px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {idx < queue.length - 1
              ? (lang === "ar" ? "التالي ←" : "Next →")
              : (lang === "ar" ? "حسناً، فهمت" : "Got it")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}

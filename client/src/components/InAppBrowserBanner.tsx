/**
 * InAppBrowserBanner
 * Shown when the app is opened inside Instagram, Snapchat, TikTok, Facebook, etc.
 * These WebViews block cookies → login key won't persist after closing the app.
 * Prompts user to open in Safari / Chrome for full functionality.
 */
import { useState, useEffect } from "react";

function detect(): { isInApp: boolean; name: string } {
  if (typeof navigator === "undefined") return { isInApp: false, name: "" };
  const ua = navigator.userAgent ?? "";
  if (/Instagram/i.test(ua))        return { isInApp: true, name: "Instagram" };
  if (/Snapchat/i.test(ua))         return { isInApp: true, name: "Snapchat" };
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return { isInApp: true, name: "Facebook" };
  if (/TikTok/i.test(ua))           return { isInApp: true, name: "TikTok" };
  if (/Twitter/i.test(ua))          return { isInApp: true, name: "Twitter" };
  return { isInApp: false, name: "" };
}

export function InAppBrowserBanner() {
  const [info, setInfo]         = useState<{ isInApp: boolean; name: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { setInfo(detect()); }, []);

  if (!info?.isInApp || dismissed) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url   = window.location.href;

  const openInBrowser = () => {
    if (isIOS) {
      // Try x-safari deep link; if blocked show copyable URL
      window.location.href = url.replace(/^https?:\/\//, "googlechrome://");
      setTimeout(() => {
        window.location.href = url.replace(/^https?:\/\//, "safari-web-app://open?url=");
      }, 300);
    } else {
      window.location.href =
        `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999999,
      background: "linear-gradient(135deg, #0F1E3D, #1B2E5E)",
      padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 3px 16px rgba(0,0,0,0.4)",
      fontFamily: "Cairo, Tajawal, system-ui, sans-serif",
    }}>
      <div dir="rtl" style={{ flex: 1 }}>
        <p style={{ color: "#FFD700", fontSize: 11, fontWeight: 900, margin: "0 0 1px" }}>
          ⚠️ أنت داخل متصفح {info.name}
        </p>
        <p style={{ color: "#A8D4E8", fontSize: 10, margin: 0, lineHeight: 1.4 }}>
          لحفظ بياناتك افتح الرابط في {isIOS ? "Safari" : "Chrome"}
        </p>
      </div>
      <button onClick={openInBrowser} style={{
        background: "#FFD700", color: "#0F1E3D", border: "none",
        borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 900,
        cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
      }}>
        🌐 افتح
      </button>
      <button onClick={() => setDismissed(true)} style={{
        background: "rgba(255,255,255,0.1)", color: "white", border: "none",
        borderRadius: 8, padding: "6px 10px", fontSize: 13,
        cursor: "pointer", flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

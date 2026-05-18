import { useState } from "react";
import { useLocation } from "wouter";
import { privacyPolicy, termsOfService } from "./legalContent";
import { useLanguage } from "../contexts/LanguageContext";

type Lang = "en" | "ar";

interface LegalPageProps {
  type: "privacy" | "terms";
}

export default function LegalPage({ type }: LegalPageProps) {
  const { lang: appLang } = useLanguage();
  const [lang, setLang] = useState<Lang>(appLang === 'ar' ? 'ar' : 'en');
  const [, navigate] = useLocation();

  const content = type === "privacy" ? privacyPolicy : termsOfService;
  const data = content[lang];
  const isRTL = lang === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: isRTL
          ? "Cairo, Tajawal, sans-serif"
          : "Inter, system-ui, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: "linear-gradient(135deg, #0F1E3D 0%, #1B2E5E 100%)",
          paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
          paddingBottom: '14px',
          paddingLeft: '20px',
          paddingRight: '20px',
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 4px 20px rgba(27,46,94,0.3)",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isRTL
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
          {isRTL ? "رجوع" : "Back"}
        </button>

        {/* Title */}
        <h1
          style={{
            color: "white",
            fontSize: 17,
            fontWeight: 800,
            margin: 0,
            textAlign: "center",
            flex: 1,
          }}
        >
          {data.title}
        </h1>

        {/* Language toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.12)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {(["ar", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                background: lang === l ? "rgba(123,184,212,0.9)" : "transparent",
                border: "none",
                padding: "7px 14px",
                color: lang === l ? "#0F1E3D" : "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {l === "ar" ? "عربي" : "EN"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Page meta */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 20,
            boxShadow: "0 2px 12px rgba(27,46,94,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h2
              style={{
                color: "#1B2E5E",
                fontSize: 22,
                fontWeight: 900,
                margin: 0,
              }}
            >
              {data.title}
            </h2>
            <p style={{ color: "#7A9BB5", fontSize: 13, margin: "4px 0 0" }}>
              {isRTL ? "آخر تحديث:" : "Last updated:"} {data.lastUpdated}
            </p>
          </div>
          {/* Prime Fit badge */}
          <div
            style={{
              background: "linear-gradient(135deg, #1B2E5E, #0F1E3D)",
              borderRadius: 10,
              padding: "6px 14px",
              color: "#7BB8D4",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Prime Fit
          </div>
        </div>

        {/* Sections */}
        {data.sections.map((section, idx) => (
          <div
            key={idx}
            style={{
              background: "white",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 12,
              boxShadow: "0 2px 12px rgba(27,46,94,0.06)",
            }}
          >
            <h3
              style={{
                color: "#1B2E5E",
                fontSize: 16,
                fontWeight: 800,
                margin: "0 0 10px",
                paddingBottom: 10,
                borderBottom: "2px solid #E8EFF7",
              }}
            >
              {section.heading}
            </h3>
            <div
              style={{
                color: "#374151",
                fontSize: 14,
                lineHeight: 1.85,
                whiteSpace: "pre-line",
              }}
            >
              {section.body}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: "20px",
            color: "#7A9BB5",
            fontSize: 12,
          }}
        >
          {isRTL
            ? "© 2026 برايم فت — شركة برايم برينتنج، الكويت"
            : "© 2026 Prime Fit — Prime Printing Co., Kuwait"}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;500;700&family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

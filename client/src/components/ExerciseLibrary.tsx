// ExerciseLibrary.tsx
// Design: Prime Fit — Navy/Sky Blue palette, Arabic RTL support
// Shows gender-specific exercises with YouTube links, grouped by category

import { useState } from "react";
import { getProgramByGender, getExercisesByCategory, type Exercise, type GenderProgram } from "@/lib/exerciseData";

interface ExerciseLibraryProps {
  gender: "male" | "female";
  language: "ar" | "en";
}

const CATEGORY_ICONS: Record<string, string> = {
  Chest: "💪",
  Back: "🔙",
  Shoulders: "🏋️",
  Arms: "💪",
  Core: "🎯",
  Glutes: "🍑",
  Legs: "🦵",
};

const REST_COLOR = (seconds: number) => {
  if (seconds <= 45) return "#22c55e";
  if (seconds <= 60) return "#7BB8D4";
  if (seconds <= 90) return "#f59e0b";
  return "#ef4444";
};

export function ExerciseLibrary({ gender, language }: ExerciseLibraryProps) {
  const isAr = language === "ar";
  const program: GenderProgram = getProgramByGender(gender);
  const grouped = getExercisesByCategory(gender);
  const categories = Object.keys(grouped);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || "");
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showGoalAlert, setShowGoalAlert] = useState(true);
  const [showTipsAlert, setShowTipsAlert] = useState(false);

  const exercises = grouped[activeCategory] || [];

  return (
    <div
      style={{
        fontFamily: isAr ? "'Segoe UI', Tahoma, Arial, sans-serif" : "'Segoe UI', sans-serif",
        direction: isAr ? "rtl" : "ltr",
        padding: "0 0 80px 0",
      }}
    >
      {/* ── Goal Alert Banner ── */}
      {showGoalAlert && (
        <div
          style={{
            background: "linear-gradient(135deg, #1B2E5E 0%, #0d1a3a 100%)",
            border: "1px solid #7BB8D4",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 14,
            position: "relative",
          }}
        >
          <button
            onClick={() => setShowGoalAlert(false)}
            style={{
              position: "absolute",
              top: 10,
              [isAr ? "left" : "right"]: 12,
              background: "none",
              border: "none",
              color: "#7BB8D4",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎯</span>
            <div>
              <div style={{ color: "#7BB8D4", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                {isAr ? "الهدف من البرنامج" : "Program Goal"}
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>
                {isAr ? program.goalAr : program.goal}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>
                  📅 {isAr ? program.scheduleAr : program.schedule}
                </span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>
                  ⏱ {isAr ? program.restBetweenSetsAr : program.restBetweenSets}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tips Toggle ── */}
      <button
        onClick={() => setShowTipsAlert(!showTipsAlert)}
        style={{
          width: "100%",
          background: showTipsAlert ? "#1B2E5E" : "rgba(27,46,94,0.4)",
          border: "1px solid #7BB8D4",
          borderRadius: 10,
          padding: "10px 16px",
          color: "#7BB8D4",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        <span>💡 {isAr ? "نصائح مهمة للبرنامج" : "Important Program Tips"}</span>
        <span>{showTipsAlert ? "▲" : "▼"}</span>
      </button>

      {showTipsAlert && (
        <div
          style={{
            background: "rgba(27,46,94,0.6)",
            border: "1px solid rgba(123,184,212,0.3)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <ul style={{ margin: 0, padding: isAr ? "0 18px 0 0" : "0 0 0 18px", listStyle: "disc" }}>
            {(isAr ? program.tipsAr : program.tips).map((tip, i) => (
              <li key={i} style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>
                {tip}
              </li>
            ))}
          </ul>

          {/* Weekly Plan */}
          <div style={{ marginTop: 12, borderTop: "1px solid rgba(123,184,212,0.2)", paddingTop: 12 }}>
            <div style={{ color: "#7BB8D4", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              📋 {isAr ? "التقسيم الأسبوعي المقترح" : "Suggested Weekly Split"}
            </div>
            {(isAr ? program.weeklyPlanAr : program.weeklyPlan).map((day, i) => (
              <div
                key={i}
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  lineHeight: 1.8,
                  paddingRight: isAr ? 8 : 0,
                  paddingLeft: isAr ? 0 : 8,
                }}
              >
                • {day}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        {categories.map((cat) => {
          const ex = grouped[cat][0];
          const label = isAr ? ex.categoryAr : cat;
          const icon = CATEGORY_ICONS[cat] || "🏋️";
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setExpandedExercise(null);
              }}
              style={{
                flexShrink: 0,
                background: isActive
                  ? "linear-gradient(135deg, #1B2E5E, #2a4a8a)"
                  : "rgba(27,46,94,0.3)",
                border: isActive ? "1px solid #7BB8D4" : "1px solid rgba(123,184,212,0.2)",
                borderRadius: 20,
                padding: "7px 14px",
                color: isActive ? "#7BB8D4" : "#64748b",
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.2s",
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span
                style={{
                  background: isActive ? "#7BB8D4" : "rgba(123,184,212,0.2)",
                  color: isActive ? "#0d1a3a" : "#64748b",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {grouped[cat].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Exercise Cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {exercises.map((ex: Exercise) => {
          const isExpanded = expandedExercise === ex.id;
          const restSec = parseInt(ex.rest);
          return (
            <div
              key={ex.id}
              style={{
                background: "linear-gradient(135deg, rgba(27,46,94,0.7) 0%, rgba(13,26,58,0.9) 100%)",
                border: isExpanded ? "1px solid #7BB8D4" : "1px solid rgba(123,184,212,0.15)",
                borderRadius: 14,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  direction: isAr ? "rtl" : "ltr",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  {/* Sets/Reps badge */}
                  <div
                    style={{
                      background: "rgba(123,184,212,0.15)",
                      border: "1px solid rgba(123,184,212,0.3)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      textAlign: "center",
                      minWidth: 52,
                    }}
                  >
                    <div style={{ color: "#7BB8D4", fontSize: 14, fontWeight: 800 }}>{ex.sets}</div>
                    <div style={{ color: "#64748b", fontSize: 10 }}>{isAr ? "جولات" : "sets"}</div>
                  </div>

                  <div style={{ flex: 1, textAlign: isAr ? "right" : "left" }}>
                    <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                      {isAr ? ex.nameAr : ex.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {ex.reps} {isAr ? "تكرار" : "reps"} &nbsp;·&nbsp;
                      <span style={{ color: REST_COLOR(restSec) }}>
                        ⏱ {isAr ? ex.restAr : `${ex.rest}s rest`}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={{ color: "#7BB8D4", fontSize: 16, marginRight: isAr ? 0 : 0, marginLeft: isAr ? 0 : 0 }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    borderTop: "1px solid rgba(123,184,212,0.15)",
                    direction: isAr ? "rtl" : "ltr",
                  }}
                >
                  {/* Stats Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginTop: 14,
                      marginBottom: 14,
                    }}
                  >
                    {[
                      { label: isAr ? "الجولات" : "Sets", value: ex.sets, icon: "🔄" },
                      { label: isAr ? "التكرارات" : "Reps", value: ex.reps, icon: "💪" },
                      { label: isAr ? "الراحة" : "Rest", value: isAr ? ex.restAr : `${ex.rest}s`, icon: "⏱" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "rgba(123,184,212,0.08)",
                          borderRadius: 10,
                          padding: "10px 8px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 18 }}>{stat.icon}</div>
                        <div style={{ color: "#7BB8D4", fontWeight: 700, fontSize: 13 }}>{stat.value}</div>
                        <div style={{ color: "#64748b", fontSize: 11 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {(isAr ? ex.notesAr : ex.notes) && (
                    <div
                      style={{
                        background: "rgba(123,184,212,0.08)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        marginBottom: 12,
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>📌</span>
                      <span style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                        {isAr ? ex.notesAr : ex.notes}
                      </span>
                    </div>
                  )}

                  {/* YouTube Button */}
                  <a
                    href={ex.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: "linear-gradient(135deg, #cc0000, #ff0000)",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "11px 16px",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <svg width="20" height="14" viewBox="0 0 20 14" fill="white">
                      <path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6C20 10.2 20 7 20 7s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/>
                    </svg>
                    {isAr ? "شاهد الشرح على يوتيوب" : "Watch Tutorial on YouTube"}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

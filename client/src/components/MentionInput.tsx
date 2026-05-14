/**
 * MentionInput — Instagram-style @mention textarea/input
 *
 * Features:
 * - Real-time user search dropdown when typing @
 * - Fuzzy search by first letters (Arabic + English)
 * - Suggested users shown when @ is typed with no query yet
 * - Keyboard navigation (↑ ↓ Enter Escape Tab)
 * - Portal-based dropdown: renders in document.body so it's NEVER clipped
 * - Always positions ABOVE the input (flips below only if not enough space)
 * - Large touch targets (56px row height) for easy mobile tapping
 * - Touch-friendly, mobile-optimized
 * - Renders as <textarea> (multiline) or <input> (single-line)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MentionUser {
  id: number;
  name: string | null;
  avatarUrl?: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  lang?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  /** Colors */
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  dropdownBg?: string;
  dropdownHoverBg?: string;
  subTextColor?: string;
  borderColor?: string;
}

// ── Avatar mini ───────────────────────────────────────────────────────────────
function MiniAvatar({ name, photoUrl, size = 36, color = "#7BB8D4" }: {
  name: string; photoUrl?: string | null; size?: number; color?: string;
}) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: `2px solid ${color}`,
      }}>
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}33, ${color}66)`,
      border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Portal Dropdown ───────────────────────────────────────────────────────────
/**
 * Renders the mention dropdown in document.body via a portal so it is never
 * clipped by overflow:hidden parents (e.g. the NewPostForm sheet).
 * Positions itself ABOVE the anchor element by default; flips below if there
 * isn't enough space above.
 */
function MentionDropdown({
  anchorRef,
  items,
  selectedIdx,
  onSelect,
  onHover,
  isRTL,
  mentionQuery,
  dropdownBg,
  dropdownHoverBg,
  textColor,
  subTextColor,
  borderColor,
  accentColor,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  items: MentionUser[];
  selectedIdx: number;
  onSelect: (u: MentionUser) => void;
  onHover: (idx: number) => void;
  isRTL: boolean;
  mentionQuery: string | null;
  dropdownBg: string;
  dropdownHoverBg: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  accentColor: string;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const update = () => {
      const rect = anchor.getBoundingClientRect();
      const dropdownH = Math.min(items.length * 64 + 40, 280); // estimated height
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceAbove > dropdownH || spaceAbove > spaceBelow;

      setPos({
        top: openUp ? rect.top + window.scrollY - dropdownH - 6 : rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUp,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, items.length]);

  if (!pos) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        background: dropdownBg,
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)",
        zIndex: 99999,
        overflow: "hidden",
        maxHeight: 280,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        // Smooth scroll on iOS
      }}
    >
      {/* Header */}
      <div style={{
        padding: "10px 14px 6px",
        fontSize: 11,
        color: subTextColor,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderBottom: `1px solid ${borderColor}`,
        background: dropdownBg,
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}>
        {mentionQuery
          ? (isRTL ? `نتائج "@${mentionQuery}"` : `Results for "@${mentionQuery}"`)
          : (isRTL ? "مقترحون" : "Suggestions")}
      </div>

      {/* User rows — 56px min height for easy tapping */}
      {items.map((u, idx) => (
        <button
          key={u.id}
          onMouseDown={e => { e.preventDefault(); onSelect(u); }}
          onTouchStart={e => { e.preventDefault(); e.stopPropagation(); onSelect(u); }}
          onMouseEnter={() => onHover(idx)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            minHeight: 56,
            padding: "10px 14px",
            background: idx === selectedIdx
              ? dropdownHoverBg
              : "transparent",
            border: "none",
            borderBottom: `1px solid ${borderColor}22`,
            cursor: "pointer",
            color: textColor,
            fontSize: 14,
            textAlign: isRTL ? "right" : "left",
            direction: isRTL ? "rtl" : "ltr",
            transition: "background 0.12s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <MiniAvatar name={u.name ?? "U"} photoUrl={u.avatarUrl} size={36} color={accentColor} />
          <div style={{ flex: 1, minWidth: 0, textAlign: isRTL ? "right" : "left" }}>
            <div style={{ fontWeight: 700, color: textColor, fontSize: 14, lineHeight: 1.3 }}>
              {u.name}
            </div>
            <div style={{ fontSize: 12, color: subTextColor, marginTop: 1 }}>
              @{u.name}
            </div>
          </div>
          {idx === selectedIdx && (
            <div style={{
              fontSize: 11, color: accentColor, fontWeight: 700, flexShrink: 0,
              background: `${accentColor}22`, borderRadius: 8, padding: "2px 7px",
            }}>
              {isRTL ? "↵" : "↵"}
            </div>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  multiline = false,
  rows = 3,
  lang = "ar",
  style,
  inputStyle,
  bgColor = "#27272A",
  textColor = "#F4F4F5",
  accentColor = "#7BB8D4",
  dropdownBg = "#1C1C1F",
  dropdownHoverBg = "#2A2A2E",
  subTextColor = "#A1A1AA",
  borderColor = "#3F3F46",
}: MentionInputProps) {
  const isRTL = lang === "ar";

  // ── Mention state ─────────────────────────────────────────────────────────
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionCursor, setMentionCursor] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // ── Query ─────────────────────────────────────────────────────────────────
  const { data: suggestions = [] } = trpc.community.getMentionSuggestions.useQuery(
    { query: mentionQuery ?? "" },
    {
      enabled: dropdownOpen,
      staleTime: 1000,
    }
  );

  // Reset selected index when suggestions change
  useEffect(() => { setSelectedIdx(0); }, [suggestions]);

  // ── Parse @mention on every keystroke ────────────────────────────────────
  const handleChange = useCallback((val: string) => {
    onChange(val);

    const el = inputRef.current;
    const cursorPos = el ? (el.selectionStart ?? val.length) : val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) {
      setDropdownOpen(false);
      setMentionQuery(null);
      return;
    }

    const afterAt = textBeforeCursor.slice(lastAtIdx + 1);
    // Allow Arabic letters, Latin letters, digits, underscore — no spaces
    const isValidQuery = /^[\w\u0600-\u06FF]{0,40}$/.test(afterAt);

    if (isValidQuery) {
      setMentionCursor(lastAtIdx);
      setMentionQuery(afterAt);
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
      setMentionQuery(null);
    }
  }, [onChange]);

  // ── Insert mention ────────────────────────────────────────────────────────
  const insertMention = useCallback((user: MentionUser) => {
    if (!user.name) return;
    const before = value.slice(0, mentionCursor);
    const after = value.slice(mentionCursor + 1 + (mentionQuery?.length ?? 0));
    const newVal = `${before}@${user.name} ${after}`;
    onChange(newVal);
    setDropdownOpen(false);
    setMentionQuery(null);
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const newPos = before.length + user.name!.length + 2;
        el.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [value, mentionCursor, mentionQuery, onChange]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!dropdownOpen || suggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const user = suggestions[selectedIdx];
      if (user) insertMention(user as MentionUser);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setMentionQuery(null);
    }
  }, [dropdownOpen, suggestions, selectedIdx, insertMention, onSubmit]);

  // ── Close dropdown on outside click/touch ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (inputRef.current && inputRef.current.contains(target)) return;
      setDropdownOpen(false);
      setMentionQuery(null);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // ── Shared input styles ───────────────────────────────────────────────────
  const sharedStyle: React.CSSProperties = {
    width: "100%",
    background: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    padding: "10px 12px",
    color: textColor,
    fontSize: 15,
    outline: "none",
    resize: "none",
    direction: isRTL ? "rtl" : "ltr",
    fontFamily: "inherit",
    lineHeight: 1.6,
    boxSizing: "border-box",
    WebkitAppearance: "none",
    ...inputStyle,
  };

  const dropdownItems = suggestions as MentionUser[];

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      {/* ── Portal dropdown — renders in document.body, never clipped ── */}
      {dropdownOpen && dropdownItems.length > 0 && (
        <MentionDropdown
          anchorRef={inputRef as React.RefObject<HTMLElement>}
          items={dropdownItems}
          selectedIdx={selectedIdx}
          onSelect={insertMention}
          onHover={setSelectedIdx}
          isRTL={isRTL}
          mentionQuery={mentionQuery}
          dropdownBg={dropdownBg}
          dropdownHoverBg={dropdownHoverBg}
          textColor={textColor}
          subTextColor={subTextColor}
          borderColor={borderColor}
          accentColor={accentColor}
        />
      )}

      {/* ── Input / Textarea ── */}
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          style={sharedStyle}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={sharedStyle}
        />
      )}
    </div>
  );
}

export default MentionInput;

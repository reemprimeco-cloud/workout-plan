/**
 * MentionInput — Instagram-style @mention textarea/input
 *
 * Features:
 * - Real-time user search dropdown when typing @
 * - Fuzzy search by first letters (Arabic + English)
 * - Suggested users shown when @ is typed with no query yet
 * - Keyboard navigation (↑ ↓ Enter Escape Tab)
 * - Touch-friendly, mobile-optimized
 * - Renders as <textarea> (multiline) or <input> (single-line)
 */
import { useState, useRef, useEffect, useCallback } from "react";
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
function MiniAvatar({ name, photoUrl, size = 28, color = "#7BB8D4" }: {
  name: string; photoUrl?: string | null; size?: number; color?: string;
}) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        overflow: "hidden", flexShrink: 0,
        border: `1.5px solid ${color}`,
      }}>
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}33, ${color}66)`,
      border: `1.5px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
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
  const [mentionCursor, setMentionCursor] = useState(0); // char index of the @ sign
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    // Find the last @ before the cursor position
    const el = inputRef.current;
    const cursorPos = el ? (el.selectionStart ?? val.length) : val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Find the last @ that is either at start or preceded by whitespace
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) {
      setDropdownOpen(false);
      setMentionQuery(null);
      return;
    }

    // Make sure there's no space between @ and cursor
    const afterAt = textBeforeCursor.slice(lastAtIdx + 1);
    const isValidQuery = /^[\w\u0600-\u06FF]{0,40}$/.test(afterAt);

    if (isValidQuery) {
      setMentionCursor(lastAtIdx);
      setMentionQuery(afterAt); // empty string = show suggested users
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
    // Restore focus and move cursor after the inserted mention
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        const newPos = before.length + user.name!.length + 2; // @name + space
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

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setMentionQuery(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Shared input props ────────────────────────────────────────────────────
  const sharedStyle: React.CSSProperties = {
    width: "100%",
    background: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: 10,
    padding: "8px 12px",
    color: textColor,
    fontSize: 14,
    outline: "none",
    resize: "none",
    direction: isRTL ? "rtl" : "ltr",
    fontFamily: "inherit",
    lineHeight: 1.6,
    boxSizing: "border-box",
    ...inputStyle,
  };

  const dropdownItems = suggestions as MentionUser[];

  return (
    <div style={{ position: "relative", width: "100%", ...style }}>
      {/* ── Mention dropdown ── */}
      {dropdownOpen && dropdownItems.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: dropdownBg,
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
            zIndex: 500,
            overflow: "hidden",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "8px 12px 4px",
            fontSize: 11,
            color: subTextColor,
            fontWeight: 600,
            letterSpacing: "0.05em",
            borderBottom: `1px solid ${borderColor}`,
          }}>
            {mentionQuery
              ? (isRTL ? `نتائج "@${mentionQuery}"` : `Results for "@${mentionQuery}"`)
              : (isRTL ? "اقتراحات" : "Suggestions")}
          </div>

          {/* User rows */}
          {dropdownItems.map((u, idx) => (
            <button
              key={u.id}
              onMouseDown={e => { e.preventDefault(); insertMention(u); }}
              onTouchStart={e => { e.preventDefault(); insertMention(u); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                background: idx === selectedIdx ? dropdownHoverBg : "transparent",
                border: "none",
                cursor: "pointer",
                color: textColor,
                fontSize: 13,
                textAlign: isRTL ? "right" : "left",
                direction: isRTL ? "rtl" : "ltr",
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setSelectedIdx(idx)}
            >
              <MiniAvatar name={u.name ?? "U"} photoUrl={u.avatarUrl} size={30} color={accentColor} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: textColor, fontSize: 13 }}>
                  {u.name}
                </div>
                <div style={{ fontSize: 11, color: subTextColor }}>
                  @{u.name}
                </div>
              </div>
              {idx === selectedIdx && (
                <div style={{ fontSize: 10, color: accentColor, fontWeight: 600, flexShrink: 0 }}>
                  {isRTL ? "↵ اختر" : "↵ select"}
                </div>
              )}
            </button>
          ))}
        </div>
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

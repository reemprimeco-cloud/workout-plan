/**
 * Community Tab — Prime Fit
 * Dark neon fitness social feed (Instagram + Strava inspired)
 * Arabic RTL + English bilingual
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";

// ── Brand colors ──────────────────────────────────────────────────────────────
const NAVY      = "#0D1B2A";
const NAVY2     = "#1B2E5E";
const CYAN      = "#00E5FF";
const CYAN_DIM  = "#00B8CC";
const ORANGE    = "#FF6B35";
const ORANGE2   = "#FF8C42";
const GREEN     = "#00FF88";
const PURPLE    = "#7C3AED";
const CARD_BG   = "#111827";
const CARD_BG2  = "#1F2937";
const TEXT_MAIN = "#F9FAFB";
const TEXT_SUB  = "#9CA3AF";

// ── Level helpers (must match server) ────────────────────────────────────────
function xpToLevel(xp: number) {
  const thresholds = [
    { level: 1, min: 0,    title: "Beginner",     titleAr: "مبتدئ" },
    { level: 2, min: 100,  title: "Active",       titleAr: "نشيط" },
    { level: 3, min: 300,  title: "Dedicated",    titleAr: "ملتزم" },
    { level: 4, min: 600,  title: "Athlete",      titleAr: "رياضي" },
    { level: 5, min: 1000, title: "Champion",     titleAr: "بطل" },
    { level: 6, min: 1500, title: "Elite",        titleAr: "نخبة" },
    { level: 7, min: 2200, title: "Legend",       titleAr: "أسطورة" },
    { level: 8, min: 3000, title: "Prime Fit Pro", titleAr: "برايم فيت برو" },
  ];
  let current = thresholds[0];
  for (const t of thresholds) { if (xp >= t.min) current = t; else break; }
  const idx = thresholds.indexOf(current);
  const next = thresholds[idx + 1];
  return { ...current, nextLevelXp: next ? next.min : current.min };
}

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  community:       { ar: "المجتمع",         en: "Community" },
  feed:            { ar: "المنشورات",        en: "Feed" },
  leaderboard:     { ar: "المتصدرون",        en: "Leaderboard" },
  challenges:      { ar: "التحديات",         en: "Challenges" },
  myXP:            { ar: "نقاطي",            en: "My XP" },
  newPost:         { ar: "منشور جديد",       en: "New Post" },
  postPlaceholder: { ar: "شارك إنجازك...",   en: "Share your achievement..." },
  share:           { ar: "نشر",              en: "Post" },
  like:            { ar: "إعجاب",            en: "Like" },
  cheer:           { ar: "تشجيع",            en: "Cheer" },
  fire:            { ar: "نار",              en: "Fire" },
  comment:         { ar: "تعليق",            en: "Comment" },
  addComment:      { ar: "أضف تعليقاً...",   en: "Add a comment..." },
  send:            { ar: "إرسال",            en: "Send" },
  join:            { ar: "انضم",             en: "Join" },
  joined:          { ar: "منضم",             en: "Joined" },
  xpReward:        { ar: "مكافأة",           en: "Reward" },
  participants:    { ar: "مشارك",            en: "participants" },
  level:           { ar: "المستوى",          en: "Level" },
  totalXP:         { ar: "إجمالي النقاط",    en: "Total XP" },
  weeklyXP:        { ar: "نقاط الأسبوع",     en: "Weekly XP" },
  badges:          { ar: "الشارات",          en: "Badges" },
  aiInsight:       { ar: "رؤية الذكاء الاصطناعي", en: "AI Insight" },
  generate:        { ar: "توليد رؤية جديدة", en: "Generate New Insight" },
  trending:        { ar: "رائج",             en: "Trending" },
  achievement:     { ar: "إنجاز",            en: "Achievement" },
  transformation:  { ar: "تحول",             en: "Transformation" },
  rank:            { ar: "المرتبة",          en: "Rank" },
  weeklyChamp:     { ar: "بطل الأسبوع",      en: "Weekly Champion" },
  stories:         { ar: "القصص",            en: "Stories" },
  visibility:      { ar: "الظهور",           en: "Visibility" },
  public:          { ar: "عام",              en: "Public" },
  friendsOnly:     { ar: "الأصدقاء",         en: "Friends" },
  private:         { ar: "خاص",              en: "Private" },
  image:           { ar: "صورة",             en: "Image" },
  text:            { ar: "نص",               en: "Text" },
  noFeed:          { ar: "لا توجد منشورات بعد. كن أول من يشارك!", en: "No posts yet. Be the first to share!" },
  loading:         { ar: "جاري التحميل...",  en: "Loading..." },
  endsIn:          { ar: "ينتهي",            en: "Ends" },
  days:            { ar: "يوم",              en: "days" },
  progress:        { ar: "التقدم",           en: "Progress" },
};

function t(key: keyof typeof T, lang: string) {
  return T[key][lang as "ar" | "en"] ?? T[key].en;
}

function timeAgo(date: Date | string, lang: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)  return lang === "ar" ? "الآن" : "just now";
  if (diff < 3600) return lang === "ar" ? `${Math.floor(diff/60)} د` : `${Math.floor(diff/60)}m`;
  if (diff < 86400) return lang === "ar" ? `${Math.floor(diff/3600)} س` : `${Math.floor(diff/3600)}h`;
  return lang === "ar" ? `${Math.floor(diff/86400)} ي` : `${Math.floor(diff/86400)}d`;
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, color = CYAN }: { name: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}33, ${color}66)`,
      border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color,
      flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

// ── Stories Bar ───────────────────────────────────────────────────────────────
function StoriesBar({ lang }: { lang: string }) {
  const { data: stories, isLoading } = trpc.community.getStories.useQuery();
  if (isLoading) return null;
  if (!stories || stories.length === 0) return null;
  return (
    <div style={{ overflowX: "auto", padding: "8px 0 4px" }}>
      <div style={{ display: "flex", gap: 12, paddingInline: 4, width: "max-content" }}>
        {stories.map(s => (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ORANGE}, ${CYAN})`,
              padding: 2,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: CARD_BG, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>
                {s.type === "streak" ? "🔥" : s.type === "achievement" ? "🏆" : s.type === "progress" ? "📊" : "💪"}
              </div>
            </div>
            <span style={{ fontSize: 10, color: TEXT_SUB, maxWidth: 56, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(s as any).userName ?? "User"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Insight Card ───────────────────────────────────────────────────────────
function AIInsightCard({ lang, streak, weeklyCompletion, currentWeight, targetWeight, name }: {
  lang: string; streak: number; weeklyCompletion: number;
  currentWeight?: number; targetWeight?: number; name?: string;
}) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generateMutation = trpc.community.getAIInsight.useMutation();

  const generate = async () => {
    setLoading(true);
    try {
      const res = await generateMutation.mutateAsync({ lang: lang as "ar" | "en", streak, weeklyCompletion, currentWeight, targetWeight, name });
      setInsight(typeof res.content === "string" ? res.content : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, []);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${NAVY2}CC, ${PURPLE}44)`,
      border: `1px solid ${CYAN}44`,
      borderRadius: 16, padding: "16px 18px", marginBottom: 12,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.07 }}>🤖</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span style={{ color: CYAN, fontWeight: 800, fontSize: 13 }}>{t("aiInsight", lang)}</span>
      </div>
      {loading ? (
        <div style={{ color: TEXT_SUB, fontSize: 13 }}>{t("loading", lang)}</div>
      ) : insight ? (
        <p style={{ color: TEXT_MAIN, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{insight}</p>
      ) : null}
      <button onClick={generate} disabled={loading} style={{
        marginTop: 12, background: "transparent", border: `1px solid ${CYAN}66`,
        borderRadius: 8, padding: "6px 14px", color: CYAN, fontSize: 12,
        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
      }}>
        {loading ? "..." : t("generate", lang)}
      </button>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, lang, currentUserId }: { post: any; lang: string; currentUserId?: number }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [localLikes, setLocalLikes] = useState<number>(post.likesCount ?? 0);
  const utils = trpc.useUtils();

  const { data: comments } = trpc.community.getComments.useQuery(
    { postId: post.id }, { enabled: showComments }
  );
  const { data: myReactionData } = trpc.community.getMyReaction.useQuery(
    { postId: post.id }, { enabled: !!currentUserId }
  );
  useEffect(() => { if (myReactionData) setMyReaction((myReactionData.type as string) ?? null); }, [myReactionData]);

  const reactMutation = trpc.community.reactToPost.useMutation({
    onMutate: ({ type }) => {
      if (myReaction) { setMyReaction(null); setLocalLikes(l => l - 1); }
      else { setMyReaction((type as string) ?? "like"); setLocalLikes(l => l + 1); }
    },
    onSettled: () => utils.community.getFeed.invalidate(),
  });
  const commentMutation = trpc.community.addComment.useMutation({
    onSuccess: () => { setCommentText(""); utils.community.getComments.invalidate({ postId: post.id }); },
  });

  const typeIcon = post.type === "achievement" ? "🏆" : post.type === "transformation" ? "🔄" : post.type === "auto" ? "⭐" : post.type === "image" ? "📸" : "💬";
  const typeLabel = post.type === "achievement" ? t("achievement", lang) : post.type === "transformation" ? t("transformation", lang) : "";

  return (
    <div style={{
      background: CARD_BG, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${CARD_BG2}`, marginBottom: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      animation: "fadeInUp 0.3s ease",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={post.userName ?? "U"} size={40} color={post.isTrending ? ORANGE : CYAN} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: TEXT_MAIN, fontWeight: 700, fontSize: 14 }}>{post.userName ?? "User"}</span>
            {post.isTrending && (
              <span style={{ background: `${ORANGE}22`, color: ORANGE, fontSize: 10, padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                🔥 {t("trending", lang)}
              </span>
            )}
            {typeLabel && (
              <span style={{ background: `${CYAN}22`, color: CYAN, fontSize: 10, padding: "2px 6px", borderRadius: 6 }}>
                {typeIcon} {typeLabel}
              </span>
            )}
          </div>
          <span style={{ color: TEXT_SUB, fontSize: 11 }}>{timeAgo(post.createdAt, lang)}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px 12px" }}>
        <p style={{ color: TEXT_MAIN, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{post.content}</p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
      )}

      {/* Reactions bar */}
      <div style={{ padding: "8px 16px", borderTop: `1px solid ${CARD_BG2}`, display: "flex", gap: 8, alignItems: "center" }}>
        {(["like", "cheer", "fire"] as const).map(rType => {
          const icons = { like: "❤️", cheer: "💪", fire: "🔥" };
          const active = myReaction === rType;
          return (
            <button key={rType} onClick={() => reactMutation.mutate({ postId: post.id, type: rType })}
              style={{
                background: active ? `${CYAN}22` : "transparent",
                border: `1px solid ${active ? CYAN : CARD_BG2}`,
                borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                color: active ? CYAN : TEXT_SUB, fontSize: 12, display: "flex", alignItems: "center", gap: 4,
                transition: "all 0.15s",
              }}>
              {icons[rType]} {rType === "like" ? localLikes : ""}
            </button>
          );
        })}
        <button onClick={() => setShowComments(v => !v)} style={{
          marginLeft: "auto", background: "transparent", border: "none",
          color: TEXT_SUB, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        }}>
          💬 {post.commentsCount ?? 0}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${CARD_BG2}` }}>
          {(comments ?? []).map((c: any) => (
            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Avatar name={c.userName ?? "U"} size={28} color={PURPLE} />
              <div style={{ background: CARD_BG2, borderRadius: 10, padding: "6px 10px", flex: 1 }}>
                <span style={{ color: CYAN, fontSize: 11, fontWeight: 700 }}>{c.userName}</span>
                <p style={{ color: TEXT_MAIN, fontSize: 12, margin: "2px 0 0" }}>{c.content}</p>
              </div>
            </div>
          ))}
          {currentUserId && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) commentMutation.mutate({ postId: post.id, content: commentText.trim() }); }}
                placeholder={t("addComment", lang)}
                style={{
                  flex: 1, background: CARD_BG2, border: `1px solid ${CARD_BG2}`,
                  borderRadius: 8, padding: "6px 10px", color: TEXT_MAIN, fontSize: 12,
                  outline: "none",
                }}
              />
              <button onClick={() => { if (commentText.trim()) commentMutation.mutate({ postId: post.id, content: commentText.trim() }); }}
                style={{ background: CYAN, color: NAVY, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {t("send", lang)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Post Form ─────────────────────────────────────────────────────────────
function NewPostForm({ lang, onClose }: { lang: string; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "image" | "achievement">("text");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => { utils.community.getFeed.invalidate(); onClose(); },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(lang === "ar" ? "الحد الأقصى 5MB" : "Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result;
      if (typeof result !== "string") return;
      const base64 = result.split(",")[1];
      setImageBase64(base64);
      setImageMime(file.type);
      setPostType("image");
    };
    reader.readAsDataURL(file);
  };

  const isRTL = lang === "ar";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div dir={isRTL ? "rtl" : "ltr"} style={{
        background: "#18181B", borderRadius: "24px 24px 0 0",
        width: "100%", maxWidth: 600,
        animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 10px",
          borderBottom: `1px solid #2A2A2E`,
        }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: TEXT_SUB,
            fontSize: 15, fontWeight: 600, cursor: "pointer", padding: "4px 8px",
          }}>
            {isRTL ? "إلغاء" : "Cancel"}
          </button>
          <span style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 15 }}>
            {t("newPost", lang)}
          </span>
          <button
            onClick={() => {
              if (!content.trim()) return;
              createPost.mutate({ type: postType, content, imageBase64: imageBase64 ?? undefined, imageMime: imageMime ?? undefined, visibility });
            }}
            disabled={!content.trim() || createPost.isPending}
            style={{
              background: content.trim() ? `linear-gradient(135deg, ${CYAN}, ${CYAN_DIM})` : "#2A2A2E",
              border: "none", borderRadius: 20,
              color: content.trim() ? NAVY : TEXT_SUB,
              fontWeight: 800, fontSize: 14, cursor: content.trim() ? "pointer" : "not-allowed",
              padding: "6px 18px", transition: "all 0.2s",
            }}>
            {createPost.isPending ? "..." : t("share", lang)}
          </button>
        </div>

        {/* ── Composer body ── */}
        <div style={{ padding: "16px 16px 0" }}>
          {/* Avatar + textarea row */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <Avatar name={"U"} size={40} />
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t("postPlaceholder", lang)}
              rows={4}
              style={{
                flex: 1, background: "transparent", border: "none",
                color: TEXT_MAIN, fontSize: 16, lineHeight: 1.6,
                resize: "none", outline: "none",
                direction: isRTL ? "rtl" : "ltr",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Image preview */}
          {imageBase64 && (
            <div style={{ position: "relative", marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
              <img
                src={`data:${imageMime};base64,${imageBase64}`}
                alt="preview"
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }}
              />
              <button
                onClick={() => { setImageBase64(null); setImageMime(null); setPostType("text"); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                  width: 28, height: 28, color: "white", cursor: "pointer", fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
          )}
        </div>

        {/* ── Type pills ── */}
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", overflowX: "auto" }}>
          {(["text", "image", "achievement"] as const).map(tp => (
            <button key={tp} onClick={() => {
              setPostType(tp);
              if (tp === "image") fileRef.current?.click();
            }} style={{
              flexShrink: 0, padding: "5px 14px", borderRadius: 20,
              border: `1.5px solid ${postType === tp ? CYAN : "#2A2A2E"}`,
              background: postType === tp ? `${CYAN}22` : "transparent",
              color: postType === tp ? CYAN : TEXT_SUB, fontSize: 12, cursor: "pointer",
              fontWeight: postType === tp ? 700 : 400,
              transition: "all 0.15s",
            }}>
              {tp === "text" ? `💬 ${t("text", lang)}` : tp === "image" ? `📸 ${t("image", lang)}` : `🏆 ${t("achievement", lang)}`}
            </button>
          ))}
          {/* Visibility pill */}
          {(["public", "friends", "private"] as const).map(v => (
            <button key={v} onClick={() => setVisibility(v)} style={{
              flexShrink: 0, padding: "5px 14px", borderRadius: 20,
              border: `1.5px solid ${visibility === v ? ORANGE : "#2A2A2E"}`,
              background: visibility === v ? `${ORANGE}22` : "transparent",
              color: visibility === v ? ORANGE : TEXT_SUB, fontSize: 12, cursor: "pointer",
              fontWeight: visibility === v ? 700 : 400,
              transition: "all 0.15s",
            }}>
              {v === "public" ? `🌍 ${t("public", lang)}` : v === "friends" ? `👥 ${t("friendsOnly", lang)}` : `🔒 ${t("private", lang)}`}
            </button>
          ))}
        </div>

        {/* ── Bottom toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "10px 16px 28px",
          borderTop: `1px solid #2A2A2E`,
        }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4,
          }} title={lang === "ar" ? "أضف صورة" : "Add photo"}>📷</button>
          <button onClick={() => setPostType("achievement")} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4,
          }} title={lang === "ar" ? "إنجاز" : "Achievement"}>🏆</button>
          <span style={{ flex: 1 }} />
          <span style={{ color: content.length > 200 ? ORANGE : TEXT_SUB, fontSize: 12 }}>
            {content.length}/500
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardPanel({ lang }: { lang: string }) {
  const { data: board, isLoading } = trpc.community.getLeaderboard.useQuery();
  const rankColors = [ORANGE, "#C0C0C0", "#CD7F32"];
  return (
    <div>
      <h3 style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>
        🏆 {t("leaderboard", lang)}
      </h3>
      {isLoading ? <div style={{ color: TEXT_SUB }}>{t("loading", lang)}</div> : (
        (board ?? []).map((entry: any, i: number) => (
          <div key={entry.userId} style={{
            background: i === 0 ? `linear-gradient(135deg, ${ORANGE}22, ${ORANGE}11)` : CARD_BG,
            border: `1px solid ${i < 3 ? rankColors[i] + "44" : CARD_BG2}`,
            borderRadius: 12, padding: "10px 14px", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <Avatar name={entry.userName} size={36} color={i < 3 ? rankColors[i] : CYAN} />
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT_MAIN, fontWeight: 700, fontSize: 13 }}>{entry.userName}</div>
              <div style={{ color: TEXT_SUB, fontSize: 11 }}>
                {lang === "ar" ? entry.titleAr : entry.title} • Lv.{entry.level}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: CYAN, fontWeight: 800, fontSize: 14 }}>{entry.weeklyXp}</div>
              <div style={{ color: TEXT_SUB, fontSize: 10 }}>XP</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Challenges ────────────────────────────────────────────────────────────────
function ChallengesPanel({ lang }: { lang: string }) {
  const { data: challenges, isLoading } = trpc.community.getChallenges.useQuery();
  const { data: myChallenges } = trpc.community.getMyChallenges.useQuery();
  const utils = trpc.useUtils();
  const joinMutation = trpc.community.joinChallenge.useMutation({
    onSuccess: () => { utils.community.getMyChallenges.invalidate(); utils.community.getChallenges.invalidate(); },
  });
  const joinedIds = new Set((myChallenges ?? []).map((c: any) => c.challengeId));

  return (
    <div>
      <h3 style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>
        🎯 {t("challenges", lang)}
      </h3>
      {isLoading ? <div style={{ color: TEXT_SUB }}>{t("loading", lang)}</div> : (
        (challenges ?? []).map((ch: any) => {
          const joined = joinedIds.has(ch.id);
          const daysLeft = daysUntil(ch.endDate);
          return (
            <div key={ch.id} style={{
              background: CARD_BG, border: `1px solid ${joined ? GREEN + "44" : CARD_BG2}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 14 }}>
                    {lang === "ar" ? ch.titleAr : ch.title}
                  </div>
                  <div style={{ color: TEXT_SUB, fontSize: 12, marginTop: 4 }}>
                    {lang === "ar" ? ch.descriptionAr : ch.description}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ color: ORANGE, fontSize: 11 }}>⚡ {ch.xpReward} XP</span>
                    <span style={{ color: TEXT_SUB, fontSize: 11 }}>👥 {ch.participantsCount} {t("participants", lang)}</span>
                    <span style={{ color: daysLeft < 3 ? ORANGE : TEXT_SUB, fontSize: 11 }}>
                      ⏳ {t("endsIn", lang)} {daysLeft} {t("days", lang)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => !joined && joinMutation.mutate({ challengeId: ch.id })}
                  disabled={joined || joinMutation.isPending}
                  style={{
                    background: joined ? `${GREEN}22` : `linear-gradient(135deg, ${CYAN}, ${CYAN_DIM})`,
                    border: `1px solid ${joined ? GREEN : "transparent"}`,
                    borderRadius: 10, padding: "8px 16px",
                    color: joined ? GREEN : NAVY, fontWeight: 800, fontSize: 13,
                    cursor: joined ? "default" : "pointer", flexShrink: 0, marginLeft: 12,
                  }}>
                  {joined ? `✅ ${t("joined", lang)}` : t("join", lang)}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── XP Panel ──────────────────────────────────────────────────────────────────
function XPPanel({ lang, streak }: { lang: string; streak: number }) {
  const { data: xpData, isLoading } = trpc.community.getMyXP.useQuery({ streak });
  if (isLoading) return <div style={{ color: TEXT_SUB }}>{t("loading", lang)}</div>;
  if (!xpData) return null;
  const { totalXp, weeklyXp, level, title, titleAr, nextLevelXp, badges } = xpData;
  const progress = nextLevelXp > 0 ? Math.min(100, (totalXp / nextLevelXp) * 100) : 100;
  return (
    <div>
      <h3 style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>
        ⭐ {t("myXP", lang)}
      </h3>
      {/* Level card */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY2}, ${PURPLE}44)`,
        border: `1px solid ${CYAN}44`, borderRadius: 16, padding: "16px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: CYAN, fontWeight: 900, fontSize: 28 }}>Lv.{level}</div>
            <div style={{ color: TEXT_MAIN, fontWeight: 700, fontSize: 14 }}>
              {lang === "ar" ? titleAr : title}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: ORANGE, fontWeight: 800, fontSize: 22 }}>{totalXp}</div>
            <div style={{ color: TEXT_SUB, fontSize: 11 }}>{t("totalXP", lang)}</div>
          </div>
        </div>
        {/* XP progress bar */}
        <div style={{ marginTop: 12, background: CARD_BG2, borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 8,
            background: `linear-gradient(90deg, ${CYAN}, ${ORANGE})`,
            width: `${progress}%`, transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: TEXT_SUB, fontSize: 10 }}>{totalXp} XP</span>
          <span style={{ color: TEXT_SUB, fontSize: 10 }}>{nextLevelXp} XP</span>
        </div>
        <div style={{ marginTop: 8, color: TEXT_SUB, fontSize: 12 }}>
          📅 {t("weeklyXP", lang)}: <span style={{ color: GREEN, fontWeight: 700 }}>{weeklyXp}</span>
        </div>
      </div>
      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <div style={{ color: TEXT_SUB, fontSize: 12, marginBottom: 8 }}>🎖️ {t("badges", lang)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {badges.map((b: any) => (
              <div key={b.id} style={{
                background: CARD_BG2, border: `1px solid ${ORANGE}44`,
                borderRadius: 10, padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ color: TEXT_MAIN, fontSize: 11, fontWeight: 600 }}>
                  {lang === "ar" ? b.labelAr : b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────
function FeedPanel({ lang, currentUserId, streak, weeklyCompletion, currentWeight, targetWeight, name }: {
  lang: string; currentUserId?: number; streak: number; weeklyCompletion: number;
  currentWeight?: number; targetWeight?: number; name?: string;
}) {
  const [showNewPost, setShowNewPost] = useState(false);
  const { data: feedData, isLoading } = trpc.community.getFeed.useQuery({ limit: 20, offset: 0 });
  const posts = feedData?.posts ?? [];

  return (
    <div>
      {/* Stories */}
      <StoriesBar lang={lang} />

      {/* AI Insight */}
      {currentUserId && (
        <AIInsightCard lang={lang} streak={streak} weeklyCompletion={weeklyCompletion}
          currentWeight={currentWeight} targetWeight={targetWeight} name={name} />
      )}

      {/* Instagram-style composer bar */}
      {currentUserId && (
        <button onClick={() => setShowNewPost(true)} style={{
          width: "100%", background: CARD_BG, border: `1px solid #2A2A2E`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        }}>
          <Avatar name={name ?? "U"} size={36} />
          <span style={{
            flex: 1, background: CARD_BG2, borderRadius: 20,
            padding: "8px 14px", color: TEXT_SUB, fontSize: 14,
            textAlign: lang === "ar" ? "right" : "left",
          }}>
            {t("postPlaceholder", lang)}
          </span>
          <span style={{ fontSize: 20, color: CYAN }}>📷</span>
        </button>
      )}

      {/* Floating Action Button */}
      {currentUserId && (
        <button
          onClick={() => setShowNewPost(true)}
          aria-label={lang === "ar" ? "منشور جديد" : "New Post"}
          style={{
            position: "fixed",
            bottom: 80,
            right: lang === "ar" ? "auto" : 20,
            left: lang === "ar" ? 20 : "auto",
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${CYAN}, ${CYAN_DIM})`,
            border: "none",
            boxShadow: `0 4px 20px ${CYAN}55, 0 0 0 4px ${CYAN}22`,
            cursor: "pointer", zIndex: 150,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, color: NAVY, fontWeight: 900,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 28px ${CYAN}88, 0 0 0 6px ${CYAN}33`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${CYAN}55, 0 0 0 4px ${CYAN}22`;
          }}
        >
          ✏️
        </button>
      )}

      {/* Posts */}
      {isLoading ? (
        <div style={{ color: TEXT_SUB, textAlign: "center", padding: 32 }}>{t("loading", lang)}</div>
      ) : posts.length === 0 ? (
        <div style={{ color: TEXT_SUB, textAlign: "center", padding: 32, fontSize: 14 }}>
          {t("noFeed", lang)}
        </div>
      ) : (
        posts.map((post: any) => (
          <PostCard key={post.id} post={post} lang={lang} currentUserId={currentUserId} />
        ))
      )}

      {showNewPost && <NewPostForm lang={lang} onClose={() => setShowNewPost(false)} />}
    </div>
  );
}

// ── Main Community Component ──────────────────────────────────────────────────
type CommunityTab = "feed" | "leaderboard" | "challenges" | "xp";

export default function Community({
  streak = 0,
  weeklyCompletion = 0,
  currentWeight,
  targetWeight,
  name,
  userId,
}: {
  streak?: number;
  weeklyCompletion?: number;
  currentWeight?: number;
  targetWeight?: number;
  name?: string;
  userId?: number;
}) {
  const { lang } = useLanguage();
  const isRTL = lang === "ar";
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");

  const tabs: { id: CommunityTab; icon: string; label: keyof typeof T }[] = [
    { id: "feed",        icon: "📱", label: "feed" },
    { id: "leaderboard", icon: "🏆", label: "leaderboard" },
    { id: "challenges",  icon: "🎯", label: "challenges" },
    { id: "xp",          icon: "⭐", label: "myXP" },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      minHeight: "100vh",
      background: NAVY,
      fontFamily: lang === "ar" ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif",
      color: TEXT_MAIN,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        padding: "16px 16px 12px",
        borderBottom: `1px solid ${CYAN}22`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: TEXT_MAIN }}>
          <span style={{ color: CYAN }}>Prime</span> {t("community", lang)}
        </h2>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: "flex", background: CARD_BG,
        borderBottom: `1px solid ${CARD_BG2}`,
        position: "sticky", top: 57, zIndex: 49,
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "10px 4px",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab.id ? `2px solid ${CYAN}` : "2px solid transparent",
            color: activeTab === tab.id ? CYAN : TEXT_SUB,
            fontSize: 11, fontWeight: 700,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{t(tab.label, lang)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "12px 12px 100px" }}>
        {activeTab === "feed" && (
          <FeedPanel lang={lang} currentUserId={userId} streak={streak}
            weeklyCompletion={weeklyCompletion} currentWeight={currentWeight}
            targetWeight={targetWeight} name={name} />
        )}
        {activeTab === "leaderboard" && <LeaderboardPanel lang={lang} />}
        {activeTab === "challenges" && <ChallengesPanel lang={lang} />}
        {activeTab === "xp" && <XPPanel lang={lang} streak={streak} />}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

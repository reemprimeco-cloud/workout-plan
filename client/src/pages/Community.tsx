/**
 * Community Tab — Prime Fit
 * Dark neon fitness social feed (Instagram + Strava inspired)
 * Arabic RTL + English bilingual
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";
import { useSocket } from "../contexts/SocketContext";
import NotificationBell from "../components/NotificationBell";
import { MentionInput } from "../components/MentionInput";
import SpinWheel from "../components/SpinWheel";

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
function Avatar({ name, size = 40, color = CYAN, photoUrl }: { name: string; size?: number; color?: string; photoUrl?: string | null }) {
  if (photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${color}`,
        overflow: "hidden", flexShrink: 0,
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
      fontSize: size * 0.35, fontWeight: 800, color,
      flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

// ── Render text with clickable @mention chips ─────────────────────────────────
function renderMentionText(text: string, accentColor: string = "#00E5FF") {
  const parts = text.split(/(@[\w؀-ۿ]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^@[\w؀-ۿ]+$/.test(part) ? (
          <span
            key={i}
            style={{
              color: accentColor,
              fontWeight: 700,
              cursor: "default",
              background: `${accentColor}18`,
              borderRadius: 4,
              padding: "0 3px",
              fontSize: "0.95em",
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.content ?? "");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);

  const utils = trpc.useUtils();
  const isOwner = currentUserId === post.userId;

  const { data: comments, refetch: refetchComments } = trpc.community.getComments.useQuery(
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
  const deletePostMutation = trpc.community.deletePost.useMutation({
    onSuccess: () => utils.community.getFeed.invalidate(),
  });
  const editPostMutation = trpc.community.editPost.useMutation({
    onSuccess: () => { setEditingPost(false); utils.community.getFeed.invalidate(); },
  });
  const deleteCommentMutation = trpc.community.deleteComment.useMutation({
    onSuccess: () => { utils.community.getComments.invalidate({ postId: post.id }); refetchComments(); },
  });
  const editCommentMutation = trpc.community.editComment.useMutation({
    onSuccess: () => { setEditingCommentId(null); utils.community.getComments.invalidate({ postId: post.id }); },
  });


  const submitComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate({ postId: post.id, content: commentText.trim() });
    }
  };

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
        <Avatar name={post.userName ?? "U"} size={36} color={post.isTrending ? ORANGE : CYAN} photoUrl={post.userAvatar} />
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
        {isOwner && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPostMenu(v => !v)}
              style={{ background: "transparent", border: "none", color: TEXT_SUB, fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
            >⋯</button>
            {showPostMenu && (
              <div style={{
                position: "absolute", right: 0, top: 28, background: CARD_BG2,
                borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                zIndex: 50, minWidth: 130, overflow: "hidden",
              }}>
                <button onClick={() => { setEditingPost(true); setEditPostText(post.content); setShowPostMenu(false); }}
                  style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: CYAN, fontSize: 13, cursor: "pointer", textAlign: lang === "ar" ? "right" : "left" }}>
                  ✏️ {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button onClick={() => { if (window.confirm(lang === "ar" ? "حذف المنشور؟" : "Delete post?")) { deletePostMutation.mutate({ postId: post.id }); setShowPostMenu(false); } }}
                  style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#EF4444", fontSize: 13, cursor: "pointer", textAlign: lang === "ar" ? "right" : "left" }}>
                  🗑️ {lang === "ar" ? "حذف" : "Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {editingPost ? (
        <div style={{ padding: "0 16px 12px" }}>
          <textarea
            value={editPostText}
            onChange={e => setEditPostText(e.target.value)}
            rows={3}
            style={{ width: "100%", background: CARD_BG2, border: `1px solid ${CYAN}`, borderRadius: 8, padding: "8px 10px", color: TEXT_MAIN, fontSize: 14, outline: "none", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => editPostMutation.mutate({ postId: post.id, content: editPostText.trim() })}
              style={{ background: CYAN, color: NAVY, border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {lang === "ar" ? "حفظ" : "Save"}
            </button>
            <button onClick={() => setEditingPost(false)}
              style={{ background: CARD_BG2, color: TEXT_SUB, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "0 16px 12px" }}>
          <p style={{ color: TEXT_MAIN, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{renderMentionText(post.content ?? "", CYAN)}</p>
        </div>
      )}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
      )}
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
      {showComments && (
        <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${CARD_BG2}` }}>
          {(comments ?? []).map((c: any) => {
            const isCommentOwner = currentUserId === c.userId;
            return (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Avatar name={c.userName ?? "U"} size={28} color={PURPLE} photoUrl={c.userAvatar} />
                <div style={{ background: CARD_BG2, borderRadius: 10, padding: "6px 10px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: CYAN, fontSize: 11, fontWeight: 700 }}>{c.userName}</span>
                    {isCommentOwner && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }}
                          style={{ background: "none", border: "none", color: TEXT_SUB, fontSize: 11, cursor: "pointer", padding: "0 2px" }}>✏️</button>
                        <button onClick={() => { if (window.confirm(lang === "ar" ? "حذف التعليق؟" : "Delete comment?")) deleteCommentMutation.mutate({ commentId: c.id }); }}
                          style={{ background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer", padding: "0 2px" }}>🗑️</button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === c.id ? (
                    <div style={{ marginTop: 4 }}>
                      <input
                        value={editCommentText}
                        onChange={e => setEditCommentText(e.target.value)}
                        style={{ width: "100%", background: CARD_BG, border: `1px solid ${CYAN}`, borderRadius: 6, padding: "4px 8px", color: TEXT_MAIN, fontSize: 12, outline: "none" }}
                        onKeyDown={e => { if (e.key === "Enter") editCommentMutation.mutate({ commentId: c.id, content: editCommentText.trim() }); if (e.key === "Escape") setEditingCommentId(null); }}
                      />
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <button onClick={() => editCommentMutation.mutate({ commentId: c.id, content: editCommentText.trim() })}
                          style={{ background: CYAN, color: NAVY, border: "none", borderRadius: 6, padding: "3px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                          {lang === "ar" ? "حفظ" : "Save"}
                        </button>
                        <button onClick={() => setEditingCommentId(null)}
                          style={{ background: "none", color: TEXT_SUB, border: "none", fontSize: 11, cursor: "pointer" }}>
                          {lang === "ar" ? "إلغاء" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: TEXT_MAIN, fontSize: 12, margin: "2px 0 0" }}>{renderMentionText(c.content ?? "", CYAN)}</p>
                  )}
                </div>
              </div>
            );
          })}
          {currentUserId && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <MentionInput
                  value={commentText}
                  onChange={setCommentText}
                  onSubmit={submitComment}
                  placeholder={`${t("addComment", lang)} (@${lang === "ar" ? "اذكر شخصاً" : "mention"})`}
                  multiline={false}
                  lang={lang}
                  bgColor={CARD_BG2}
                  textColor={TEXT_MAIN}
                  accentColor={CYAN}
                  dropdownBg={CARD_BG}
                  dropdownHoverBg={CARD_BG2}
                  subTextColor={TEXT_SUB}
                  borderColor={CARD_BG2}
                  inputStyle={{ fontSize: 12, padding: "6px 10px", borderRadius: 8 }}
                />
              </div>
              <button onClick={submitComment}
                style={{ background: CYAN, color: NAVY, border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
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
  const canPost = content.trim().length > 0 && !createPost.isPending;

  return (
    /* Full-screen overlay */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet — full width, up to 100dvh, slides up */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          background: "#18181B",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 640,
          /* On mobile: fill available height above keyboard */
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* ── Drag handle ── */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#3F3F46" }} />
        </div>

        {/* ── Header bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "4px 16px 12px",
          borderBottom: "1px solid #2A2A2E",
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              background: "#27272A", border: "none", color: "#A1A1AA",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              padding: "8px 14px", borderRadius: 20,
              minWidth: 64, minHeight: 36,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </button>

          <span style={{ color: "#F4F4F5", fontWeight: 800, fontSize: 15 }}>
            {t("newPost", lang)}
          </span>

          <button
            onClick={() => {
              if (!canPost) return;
              createPost.mutate({
                type: postType,
                content,
                imageBase64: imageBase64 ?? undefined,
                imageMime: imageMime ?? undefined,
                visibility,
              });
            }}
            disabled={!canPost}
            style={{
              background: canPost ? `linear-gradient(135deg, ${CYAN}, ${CYAN_DIM})` : "#27272A",
              border: "none", borderRadius: 20,
              color: canPost ? NAVY : "#52525B",
              fontWeight: 800, fontSize: 14,
              cursor: canPost ? "pointer" : "not-allowed",
              padding: "8px 18px", minHeight: 36, minWidth: 64,
              transition: "all 0.2s",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {createPost.isPending ? "..." : t("share", lang)}
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          padding: "16px 16px 0",
        }}>
          {/* Avatar + textarea */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <Avatar name={"U"} size={40} />
            <MentionInput
              value={content}
              onChange={setContent}
              placeholder={t("postPlaceholder", lang)}
              multiline={true}
              rows={6}
              lang={lang}
              bgColor="transparent"
              textColor={TEXT_MAIN}
              accentColor={CYAN}
              dropdownBg="#1C1C1F"
              dropdownHoverBg="#2A2A2E"
              subTextColor={TEXT_SUB}
              borderColor="transparent"
              inputStyle={{
                fontSize: 16,
                padding: "0",
                border: "none",
                borderRadius: 0,
                minHeight: 120,
              }}
              style={{ flex: 1 }}
            />
          </div>

          {/* Image preview */}
          {imageBase64 && (
            <div style={{ position: "relative", marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
              <img
                src={`data:${imageMime};base64,${imageBase64}`}
                alt="preview"
                style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }}
              />
              <button
                onClick={() => { setImageBase64(null); setImageMime(null); setPostType("text"); }}
                style={{
                  position: "absolute", top: 8, right: 8,
                  background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%",
                  width: 32, height: 32, color: "white", cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>
          )}

          {/* Type pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}>
            {(["text", "image", "achievement"] as const).map(tp => (
              <button key={tp} onClick={() => {
                setPostType(tp);
                if (tp === "image") fileRef.current?.click();
              }} style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 20,
                border: `1.5px solid ${postType === tp ? CYAN : "#2A2A2E"}`,
                background: postType === tp ? `${CYAN}22` : "transparent",
                color: postType === tp ? CYAN : TEXT_SUB,
                fontSize: 13, cursor: "pointer",
                fontWeight: postType === tp ? 700 : 400,
                transition: "all 0.15s",
                minHeight: 36,
                WebkitTapHighlightColor: "transparent",
              }}>
                {tp === "text" ? `💬 ${t("text", lang)}` : tp === "image" ? `📸 ${t("image", lang)}` : `🏆 ${t("achievement", lang)}`}
              </button>
            ))}
          </div>

          {/* Visibility pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {(["public", "friends", "private"] as const).map(v => (
              <button key={v} onClick={() => setVisibility(v)} style={{
                flexShrink: 0, padding: "7px 16px", borderRadius: 20,
                border: `1.5px solid ${visibility === v ? ORANGE : "#2A2A2E"}`,
                background: visibility === v ? `${ORANGE}22` : "transparent",
                color: visibility === v ? ORANGE : TEXT_SUB,
                fontSize: 13, cursor: "pointer",
                fontWeight: visibility === v ? 700 : 400,
                transition: "all 0.15s",
                minHeight: 36,
                WebkitTapHighlightColor: "transparent",
              }}>
                {v === "public" ? `🌍 ${t("public", lang)}` : v === "friends" ? `👥 ${t("friendsOnly", lang)}` : `🔒 ${t("private", lang)}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pinned bottom toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          borderTop: "1px solid #2A2A2E",
          background: "#18181B",
          flexShrink: 0,
        }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: "#27272A", border: "none", cursor: "pointer",
              fontSize: 20, padding: "8px 12px", borderRadius: 12,
              minWidth: 44, minHeight: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
            title={lang === "ar" ? "أضف صورة" : "Add photo"}
          >📷</button>
          <button
            onClick={() => setPostType("achievement")}
            style={{
              background: postType === "achievement" ? `${ORANGE}22` : "#27272A",
              border: "none", cursor: "pointer",
              fontSize: 20, padding: "8px 12px", borderRadius: 12,
              minWidth: 44, minHeight: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
            title={lang === "ar" ? "إنجاز" : "Achievement"}
          >🏆</button>
          <span style={{ flex: 1 }} />
          <span style={{
            color: content.length > 400 ? ORANGE : TEXT_SUB,
            fontSize: 12, fontWeight: 600,
          }}>
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
  const [spinChallengeId, setSpinChallengeId] = useState<number | null>(null);
  const joinMutation = trpc.community.joinChallenge.useMutation({
    onSuccess: () => { utils.community.getMyChallenges.invalidate(); utils.community.getChallenges.invalidate(); },
  });
  const completeMutation = trpc.community.completeChallenge.useMutation({
    onSuccess: (data, vars) => {
      utils.community.getMyChallenges.invalidate();
      if (!data.alreadyCompleted) {
        setSpinChallengeId(vars.challengeId);
      }
    },
  });
  const joinedMap = new Map((myChallenges ?? []).map((c: any) => [c.challengeId, c]));
  return (
    <div>
      {spinChallengeId !== null && (
        <SpinWheel
          challengeId={spinChallengeId}
          lang={lang as "ar" | "en"}
          onClose={() => setSpinChallengeId(null)}
        />
      )}
      <h3 style={{ color: TEXT_MAIN, fontWeight: 800, fontSize: 16, margin: "0 0 12px" }}>
        🎯 {t("challenges", lang)}
      </h3>
      {isLoading ? <div style={{ color: TEXT_SUB }}>{t("loading", lang)}</div> : (
        (challenges ?? []).map((ch: any) => {
          const participation = joinedMap.get(ch.id);
          const joined = !!participation;
          const completed = !!participation?.completedAt;
          const daysLeft = daysUntil(ch.endDate);
          return (
            <div key={ch.id} style={{
              background: CARD_BG,
              border: `1px solid ${completed ? ORANGE + "66" : joined ? GREEN + "44" : CARD_BG2}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 10,
              position: "relative", overflow: "hidden",
            }}>
              {completed && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  background: `linear-gradient(135deg, ${ORANGE}, #FF4040)`,
                  color: "white", fontSize: 9, fontWeight: 900,
                  padding: "3px 10px", borderBottomLeftRadius: 8,
                  letterSpacing: "0.05em",
                }}>
                  {lang === "ar" ? "✅ مكتمل" : "✅ DONE"}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, paddingRight: completed ? 60 : 0 }}>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button
                    onClick={() => !joined && joinMutation.mutate({ challengeId: ch.id })}
                    disabled={joined || joinMutation.isPending}
                    style={{
                      background: joined ? `${GREEN}22` : `linear-gradient(135deg, ${CYAN}, ${CYAN_DIM})`,
                      border: `1px solid ${joined ? GREEN : "transparent"}`,
                      borderRadius: 10, padding: "8px 16px",
                      color: joined ? GREEN : NAVY, fontWeight: 800, fontSize: 13,
                      cursor: joined ? "default" : "pointer",
                    }}>
                    {joined ? `✅ ${t("joined", lang)}` : t("join", lang)}
                  </button>
                  {joined && !completed && (
                    <button
                      onClick={() => completeMutation.mutate({ challengeId: ch.id })}
                      disabled={completeMutation.isPending}
                      style={{
                        background: `linear-gradient(135deg, ${ORANGE}, #FF4040)`,
                        border: "none", borderRadius: 10, padding: "8px 16px",
                        color: "white", fontWeight: 800, fontSize: 12, cursor: "pointer",
                        boxShadow: `0 4px 12px ${ORANGE}44`,
                      }}>
                      {lang === "ar" ? "🎰 أكملت!" : "🎰 Done!"}
                    </button>
                  )}
                  {completed && (
                    <button
                      onClick={() => setSpinChallengeId(ch.id)}
                      style={{
                        background: `${ORANGE}22`, border: `1px solid ${ORANGE}44`,
                        borderRadius: 10, padding: "8px 16px",
                        color: ORANGE, fontWeight: 800, fontSize: 12, cursor: "pointer",
                      }}>
                      {lang === "ar" ? "🎁 مكافأة" : "🎁 Reward"}
                    </button>
                  )}
                </div>
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
  const { data: feedData, isLoading, refetch } = trpc.community.getFeed.useQuery({ limit: 20, offset: 0 });
  const [livePosts, setLivePosts] = useState<any[]>([]);
  const { socket } = useSocket();

  // Listen for new posts via socket and prepend them
  useEffect(() => {
    if (!socket) return;
    const handler = (post: any) => {
      setLivePosts(prev => {
        if (prev.find(p => p.id === post.id)) return prev;
        return [post, ...prev];
      });
    };
    socket.on("new_post", handler);
    return () => { socket.off("new_post", handler); };
  }, [socket]);

  const allPosts = [
    ...livePosts.filter(lp => !(feedData?.posts ?? []).find((p: any) => p.id === lp.id)),
    ...(feedData?.posts ?? []),
  ];

  return (
    <div>
      {/* Stories */}
      <StoriesBar lang={lang} />

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{
          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
          background: GREEN,
          boxShadow: `0 0 6px ${GREEN}`,
          animation: "livePulse 1.5s ease-in-out infinite",
        }} />
        <span style={{ color: GREEN, fontSize: 11, fontWeight: 700 }}>
          {lang === "ar" ? "مباشر" : "LIVE"}
        </span>
      </div>

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
      ) : allPosts.length === 0 ? (
        <div style={{ color: TEXT_SUB, textAlign: "center", padding: 32, fontSize: 14 }}>
          {t("noFeed", lang)}
        </div>
      ) : (
        allPosts.map((post: any) => (
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
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: TEXT_MAIN }}>
          <span style={{ color: CYAN }}>Prime</span> {t("community", lang)}
        </h2>
        <NotificationBell lang={lang} />
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
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

/**
 * Community Page — Prime Fit
 * Instagram / X-style redesign
 * White bg, #1B2E5E navy accents
 * Preserves: Feed, Leaderboard, Challenges, XP, Stories, AI Insight
 * New: Follow/Unfollow, DM, User Profiles, Feed tabs (For You/Following/Trending), Bookmarks
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "../contexts/LanguageContext";
import { useSocket } from "../contexts/SocketContext";
import NotificationBell from "../components/NotificationBell";
import { MentionInput } from "../components/MentionInput";
import SpinWheel from "../components/SpinWheel";
import {
  Heart, MessageCircle, Repeat2, Bookmark, BookmarkCheck,
  Send, Plus, Search, ChevronLeft, MoreHorizontal,
  Globe, Users, Lock, UserPlus, UserCheck, X, Camera, Trophy,
  Zap, Flame, Star,
} from "lucide-react";

// ── Brand ─────────────────────────────────────────────────────────────────────
const NAVY   = "#1B2E5E";
const NAVY_D = "#0F1E3D";
const SKY    = "#7BB8D4";
const BG     = "#F5F7FA";
const CARD   = "#FFFFFF";
const BORDER = "#E8ECF0";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";
const GREEN  = "#22C55E";
const ORANGE = "#F97316";

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
  comment:         { ar: "تعليق",            en: "Comment" },
  addComment:      { ar: "أضف تعليقاً...",   en: "Add a comment..." },
  join:            { ar: "انضم",             en: "Join" },
  joined:          { ar: "منضم",             en: "Joined" },
  participants:    { ar: "مشارك",            en: "participants" },
  totalXP:         { ar: "إجمالي النقاط",    en: "Total XP" },
  weeklyXP:        { ar: "نقاط الأسبوع",     en: "Weekly XP" },
  badges:          { ar: "الشارات",          en: "Badges" },
  aiInsight:       { ar: "رؤية الذكاء الاصطناعي", en: "AI Insight" },
  generate:        { ar: "توليد رؤية جديدة", en: "Generate New Insight" },
  trending:        { ar: "رائج",             en: "Trending" },
  achievement:     { ar: "إنجاز",            en: "Achievement" },
  public:          { ar: "عام",              en: "Public" },
  friendsOnly:     { ar: "الأصدقاء",         en: "Friends" },
  private:         { ar: "خاص",              en: "Private" },
  image:           { ar: "صورة",             en: "Image" },
  text:            { ar: "نص",               en: "Text" },
  noFeed:          { ar: "لا توجد منشورات بعد. كن أول من يشارك!", en: "No posts yet. Be the first to share!" },
  loading:         { ar: "جاري التحميل...",  en: "Loading..." },
  endsIn:          { ar: "ينتهي",            en: "Ends" },
  days:            { ar: "يوم",              en: "days" },
  forYou:          { ar: "لك",              en: "For You" },
  following:       { ar: "المتابَعون",       en: "Following" },
  messages:        { ar: "الرسائل",          en: "Messages" },
  follow:          { ar: "متابعة",           en: "Follow" },
  followingBtn:    { ar: "تتابعه",           en: "Following" },
  message:         { ar: "رسالة",            en: "Message" },
  posts:           { ar: "المنشورات",        en: "Posts" },
  followers:       { ar: "متابع",            en: "Followers" },
  followingCount:  { ar: "يتابع",            en: "Following" },
  noPosts:         { ar: "لا توجد منشورات بعد", en: "No posts yet" },
  noMessages:      { ar: "لا توجد رسائل بعد", en: "No messages yet" },
  typeMessage:     { ar: "اكتب رسالة...",    en: "Type a message..." },
  searchUsers:     { ar: "ابحث عن مستخدمين...", en: "Search users..." },
  cancel:          { ar: "إلغاء",            en: "Cancel" },
};

function t(key: keyof typeof T, lang: string) {
  return T[key]?.[lang as "ar" | "en"] ?? T[key]?.en ?? key;
}

function timeAgo(date: Date | string | number, lang: string): string {
  const d = typeof date === "number" ? new Date(date) : typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return lang === "ar" ? "الآن" : "now";
  if (diff < 3600)  return lang === "ar" ? `${Math.floor(diff/60)} د` : `${Math.floor(diff/60)}m`;
  if (diff < 86400) return lang === "ar" ? `${Math.floor(diff/3600)} س` : `${Math.floor(diff/3600)}h`;
  return lang === "ar" ? `${Math.floor(diff/86400)} ي` : `${Math.floor(diff/86400)}d`;
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function initials(name: string): string {
  return (name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, photoUrl }: { name?: string | null; size?: number; photoUrl?: string | null }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name ?? ""} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${NAVY}, ${SKY})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {initials(name ?? "U")}
    </div>
  );
}

// ── Render @mentions ──────────────────────────────────────────────────────────
function renderMentionText(text: string) {
  const parts = text.split(/(@[\w\u0600-\u06FF]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^@[\w\u0600-\u06FF]+$/.test(part) ? (
          <span key={i} style={{ color: SKY, fontWeight: 700, background: `${SKY}18`, borderRadius: 4, padding: "0 3px" }}>{part}</span>
        ) : <span key={i}>{part}</span>
      )}
    </>
  );
}

// ── Stories Bar ───────────────────────────────────────────────────────────────
function StoriesBar({ lang }: { lang: string }) {
  const { data: stories } = trpc.community.getStories.useQuery();
  if (!stories || stories.length === 0) return null;
  return (
    <div style={{ overflowX: "auto", padding: "12px 0 8px", background: CARD, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", gap: 14, paddingInline: 16, width: "max-content" }}>
        {stories.map((s: any) => (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 58, height: 58, borderRadius: "50%", background: `linear-gradient(135deg, ${NAVY}, ${SKY})`, padding: 2 }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: CARD, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Avatar name={s.userName ?? "U"} size={50} />
              </div>
            </div>
            <span style={{ fontSize: 10, color: MUTED, maxWidth: 58, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.userName ?? "User"}
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
    } finally { setLoading(false); }
  };

  useEffect(() => { generate(); }, []);

  return (
    <div style={{ background: `linear-gradient(135deg, ${NAVY}08, ${SKY}12)`, border: `1px solid ${NAVY}22`, borderRadius: 16, padding: "14px 16px", margin: "12px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Zap size={16} color={NAVY} />
        <span style={{ color: NAVY, fontWeight: 800, fontSize: 13 }}>{t("aiInsight", lang)}</span>
      </div>
      {loading ? (
        <div style={{ color: MUTED, fontSize: 13 }}>{t("loading", lang)}</div>
      ) : insight ? (
        <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{insight}</p>
      ) : null}
      <button onClick={generate} disabled={loading} style={{ marginTop: 10, background: "transparent", border: `1px solid ${NAVY}44`, borderRadius: 8, padding: "6px 14px", color: NAVY, fontSize: 12, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}>
        {loading ? "..." : t("generate", lang)}
      </button>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, lang, currentUserId, onProfileClick }: {
  post: any; lang: string; currentUserId?: number; onProfileClick: (id: number) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [localLikes, setLocalLikes] = useState<number>(post.likesCount ?? 0);
  const [bookmarked, setBookmarked] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editPostText, setEditPostText] = useState(post.content ?? "");
  const [showPostMenu, setShowPostMenu] = useState(false);

  const utils = trpc.useUtils();
  const isOwner = currentUserId === post.userId;

  const { data: comments } = trpc.community.getComments.useQuery({ postId: post.id }, { enabled: showComments });
  const { data: myReactionData } = trpc.community.getMyReaction.useQuery({ postId: post.id }, { enabled: !!currentUserId });
  const { data: bm } = trpc.community.isBookmarked.useQuery({ postId: post.id }, { enabled: !!currentUserId });

  useEffect(() => { if (myReactionData) setMyReaction((myReactionData.type as string) ?? null); }, [myReactionData]);
  useEffect(() => { if (bm?.bookmarked !== undefined) setBookmarked(bm.bookmarked); }, [bm]);

  const reactMutation = trpc.community.reactToPost.useMutation({
    onMutate: () => {
      if (myReaction) { setMyReaction(null); setLocalLikes(l => l - 1); }
      else { setMyReaction("like"); setLocalLikes(l => l + 1); }
    },
    onSettled: () => utils.community.getFeed.invalidate(),
  });
  const commentMutation = trpc.community.addComment.useMutation({
    onSuccess: () => { setCommentText(""); utils.community.getComments.invalidate({ postId: post.id }); },
  });
  const deletePostMutation = trpc.community.deletePost.useMutation({ onSuccess: () => utils.community.getFeed.invalidate() });
  const editPostMutation = trpc.community.editPost.useMutation({ onSuccess: () => { setEditingPost(false); utils.community.getFeed.invalidate(); } });
  const bookmarkMut = trpc.community.bookmarkPost.useMutation({ onMutate: () => setBookmarked(true) });
  const unbookmarkMut = trpc.community.unbookmarkPost.useMutation({ onMutate: () => setBookmarked(false) });

  return (
    <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <button onClick={() => onProfileClick(post.userId)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Avatar name={post.userName} photoUrl={post.userAvatar} size={42} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => onProfileClick(post.userId)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700, fontSize: 14, color: TEXT }}>
              {post.userName ?? "User"}
            </button>
            {post.isTrending && <span style={{ background: `${ORANGE}18`, color: ORANGE, fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><Flame size={9} />{t("trending", lang)}</span>}
            {post.type === "achievement" && <span style={{ background: `${NAVY}10`, color: NAVY, fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}><Trophy size={9} />{t("achievement", lang)}</span>}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>{timeAgo(post.createdAt, lang)}</div>
        </div>
        {isOwner && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPostMenu(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
              <MoreHorizontal size={18} />
            </button>
            {showPostMenu && (
              <div style={{ position: "absolute", right: 0, top: 28, background: CARD, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 130, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <button onClick={() => { setEditingPost(true); setEditPostText(post.content); setShowPostMenu(false); }}
                  style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: NAVY, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  ✏️ {lang === "ar" ? "تعديل" : "Edit"}
                </button>
                <button onClick={() => { if (window.confirm(lang === "ar" ? "حذف المنشور؟" : "Delete post?")) { deletePostMutation.mutate({ postId: post.id }); setShowPostMenu(false); } }}
                  style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#EF4444", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  🗑️ {lang === "ar" ? "حذف" : "Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit mode */}
      {editingPost ? (
        <div style={{ marginBottom: 10 }}>
          <textarea value={editPostText} onChange={e => setEditPostText(e.target.value)}
            style={{ width: "100%", border: `1.5px solid ${NAVY}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "none", minHeight: 80, outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={() => editPostMutation.mutate({ postId: post.id, content: editPostText })}
              style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {lang === "ar" ? "حفظ" : "Save"}
            </button>
            <button onClick={() => setEditingPost(false)}
              style={{ background: BG, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>
              {t("cancel", lang)}
            </button>
          </div>
        </div>
      ) : (
        <p style={{ margin: "0 0 10px", fontSize: 15, lineHeight: 1.6, color: TEXT, whiteSpace: "pre-wrap" }}>
          {renderMentionText(post.content ?? "")}
        </p>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
          <img src={post.imageUrl} alt="" style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button onClick={() => { if (currentUserId) reactMutation.mutate({ postId: post.id, type: "like" }); }}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: myReaction ? "#EF4444" : MUTED, fontSize: 13, fontWeight: 600 }}>
          <Heart size={18} fill={myReaction ? "#EF4444" : "none"} />
          {localLikes > 0 && <span>{localLikes}</span>}
        </button>
        <button onClick={() => setShowComments(p => !p)}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: showComments ? NAVY : MUTED, fontSize: 13, fontWeight: 600 }}>
          <MessageCircle size={18} />
          {(post.commentsCount ?? 0) > 0 && <span>{post.commentsCount}</span>}
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: MUTED }}>
          <Repeat2 size={18} />
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => { if (!currentUserId) return; bookmarked ? unbookmarkMut.mutate({ postId: post.id }) : bookmarkMut.mutate({ postId: post.id }); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: bookmarked ? NAVY : MUTED }}>
          {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
          {(comments ?? []).map((c: any) => (
            <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Avatar name={c.userName} size={30} />
              <div style={{ background: BG, borderRadius: 12, padding: "8px 12px", flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: NAVY, marginBottom: 2 }}>{c.userName ?? "User"}</div>
                <div style={{ fontSize: 13, color: TEXT }}>{c.content}</div>
              </div>
            </div>
          ))}
          {currentUserId && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder={t("addComment", lang)}
                style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "8px 14px", fontSize: 13, outline: "none", background: BG }}
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) commentMutation.mutate({ postId: post.id, content: commentText.trim() }); }} />
              <button onClick={() => { if (commentText.trim()) commentMutation.mutate({ postId: post.id, content: commentText.trim() }); }}
                style={{ background: NAVY, color: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Post Form (bottom sheet) ──────────────────────────────────────────────
function NewPostForm({ lang, onClose, currentUser }: { lang: string; onClose: () => void; currentUser?: any }) {
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "image" | "achievement">("text");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.community.createPost.useMutation({
    onSuccess: () => { utils.community.getFeed.invalidate(); onClose(); },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImageBase64(result.split(",")[1]);
      setImageMime(file.type);
      setPostType("image");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!content.trim() && !imageBase64) return;
    createMutation.mutate({ type: postType, content: content.trim() || "📸", visibility, imageBase64: imageBase64 ?? undefined, imageMime: imageMime ?? undefined });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ background: CARD, borderRadius: "20px 20px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ width: 40, height: 4, background: BORDER, borderRadius: 2, margin: "12px auto 0" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={20} /></button>
          <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{t("newPost", lang)}</span>
          <button onClick={handleSubmit} disabled={(!content.trim() && !imageBase64) || createMutation.isPending}
            style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 20, padding: "8px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!content.trim() && !imageBase64) ? 0.5 : 1 }}>
            {t("share", lang)}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Avatar name={currentUser?.name} size={44} />
            <MentionInput value={content} onChange={setContent} placeholder={t("postPlaceholder", lang)} multiline={true} rows={5} lang={lang}
              bgColor="transparent" textColor={TEXT} accentColor={NAVY} dropdownBg={CARD} dropdownHoverBg={BG} subTextColor={MUTED} borderColor="transparent"
              inputStyle={{ fontSize: 16, padding: "0", border: "none", borderRadius: 0, minHeight: 100 }} style={{ flex: 1 }} />
          </div>
          {imageBase64 && (
            <div style={{ position: "relative", marginTop: 12 }}>
              <img src={`data:${imageMime};base64,${imageBase64}`} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 250, objectFit: "cover" }} />
              <button onClick={() => { setImageBase64(null); setImageMime(null); setPostType("text"); }}
                style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", gap: 8, padding: "10px 0 6px", flexWrap: "wrap" }}>
            {([["text", "💬", t("text", lang)], ["image", "📷", t("image", lang)], ["achievement", "🏆", t("achievement", lang)]] as const).map(([tp, icon, label]) => (
              <button key={tp} onClick={() => { setPostType(tp as any); if (tp === "image") fileRef.current?.click(); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${postType === tp ? NAVY : BORDER}`, background: postType === tp ? NAVY : "transparent", color: postType === tp ? "#fff" : MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {icon} {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["public", "friends", "private"] as const).map(v => {
              const icons = { public: <Globe size={13} />, friends: <Users size={13} />, private: <Lock size={13} /> };
              const labels = { public: t("public", lang), friends: t("friendsOnly", lang), private: t("private", lang) };
              return (
                <button key={v} onClick={() => setVisibility(v)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${visibility === v ? ORANGE : BORDER}`, background: visibility === v ? `${ORANGE}12` : "transparent", color: visibility === v ? ORANGE : MUTED, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {icons[v]} {labels[v]}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: MUTED, textAlign: "right", marginTop: 6 }}>{content.length}/500</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// ── User Profile View ─────────────────────────────────────────────────────────
function UserProfileView({ userId, currentUserId, lang, onBack, onDM }: {
  userId: number; currentUserId?: number; lang: string; onBack: () => void; onDM: (id: number) => void;
}) {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.community.getUserProfile.useQuery({ userId });
  const followMut = trpc.community.followUser.useMutation({ onSuccess: () => utils.community.getUserProfile.invalidate({ userId }) });
  const unfollowMut = trpc.community.unfollowUser.useMutation({ onSuccess: () => utils.community.getUserProfile.invalidate({ userId }) });
  const { data: feedData } = trpc.community.getFeed.useQuery({ limit: 50, offset: 0 });
  const userPosts = (feedData?.posts ?? []).filter((p: any) => p.userId === userId);
  const isOwnProfile = currentUserId === userId;

  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: MUTED }}>...</div>;
  if (!profile) return null;

  return (
    <div style={{ background: BG, minHeight: "100%" }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}><ChevronLeft size={22} /></button>
        <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{profile.name ?? "User"}</span>
      </div>
      <div style={{ background: CARD, padding: "24px 16px 16px", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          <Avatar name={profile.name} size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: TEXT }}>{profile.name ?? "User"}</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>@{(profile.name ?? "user").toLowerCase().replace(/\s+/g, ".")}</div>
            <div style={{ display: "flex", gap: 20 }}>
              {[{ label: t("posts", lang), value: profile.postCount ?? 0 }, { label: t("followers", lang), value: profile.followers ?? 0 }, { label: t("followingCount", lang), value: profile.following ?? 0 }].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: NAVY }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {!isOwnProfile && currentUserId && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => profile.isFollowing ? unfollowMut.mutate({ userId }) : followMut.mutate({ userId })}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", background: profile.isFollowing ? BG : NAVY, color: profile.isFollowing ? TEXT : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {profile.isFollowing ? <><UserCheck size={15} /> {t("followingBtn", lang)}</> : <><UserPlus size={15} /> {t("follow", lang)}</>}
            </button>
            <button onClick={() => onDM(userId)} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${BORDER}`, background: CARD, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: TEXT }}>
              <MessageCircle size={15} /> {t("message", lang)}
            </button>
          </div>
        )}
      </div>
      <div style={{ background: CARD }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 14, color: TEXT }}>{t("posts", lang)}</div>
        {userPosts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 14 }}>{t("noPosts", lang)}</div>
        ) : userPosts.map((p: any) => (
          <PostCard key={p.id} post={p} lang={lang} currentUserId={currentUserId} onProfileClick={() => {}} />
        ))}
      </div>
    </div>
  );
}

// ── DM Chat View ──────────────────────────────────────────────────────────────
function DMChatView({ partnerId, currentUserId, lang, onBack }: {
  partnerId: number; currentUserId: number; lang: string; onBack: () => void;
}) {
  const utils = trpc.useUtils();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = trpc.community.getDMConversation.useQuery({ partnerId });
  const sendMut = trpc.community.sendDM.useMutation({ onSuccess: () => { setText(""); utils.community.getDMConversation.invalidate({ partnerId }); } });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [data]);

  const partner = data?.partner;
  const messages = data?.messages ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: BG }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}><ChevronLeft size={22} /></button>
        <Avatar name={partner?.name} size={36} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{partner?.name ?? "User"}</div>
          <div style={{ fontSize: 11, color: MUTED }}>@{(partner?.name ?? "user").toLowerCase().replace(/\s+/g, ".")}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {isLoading && <div style={{ textAlign: "center", color: MUTED }}>...</div>}
        {messages.map((m: any) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 8 }}>
              {!isMine && <Avatar name={partner?.name} size={28} />}
              <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMine ? `linear-gradient(135deg, ${NAVY}, ${SKY})` : CARD, color: isMine ? "#fff" : TEXT, fontSize: 14, lineHeight: 1.5, marginLeft: isMine ? 0 : 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                {m.content}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: isMine ? "right" : "left" }}>{timeAgo(m.createdAt, lang)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, padding: "10px 12px", display: "flex", gap: 8, flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder={t("typeMessage", lang)}
          style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 24, padding: "10px 16px", fontSize: 14, outline: "none", background: BG }}
          onKeyDown={e => { if (e.key === "Enter" && text.trim()) sendMut.mutate({ receiverId: partnerId, content: text.trim() }); }} />
        <button onClick={() => { if (text.trim()) sendMut.mutate({ receiverId: partnerId, content: text.trim() }); }}
          style={{ background: NAVY, color: "#fff", border: "none", borderRadius: "50%", width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ── DM List View ──────────────────────────────────────────────────────────────
function DMListView({ lang, onBack, onChat }: { lang: string; onBack: () => void; onChat: (id: number) => void }) {
  const { data: convos, isLoading } = trpc.community.getDMList.useQuery();
  return (
    <div style={{ background: BG, minHeight: "100%" }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 4 }}><ChevronLeft size={22} /></button>
        <span style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{t("messages", lang)}</span>
      </div>
      {isLoading && <div style={{ padding: 40, textAlign: "center", color: MUTED }}>...</div>}
      {(!convos || convos.length === 0) && !isLoading && (
        <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
          <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>{t("noMessages", lang)}</div>
        </div>
      )}
      {(convos ?? []).map((c: any) => (
        <button key={c.partnerId} onClick={() => onChat(c.partnerId)}
          style={{ width: "100%", background: CARD, border: "none", borderBottom: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", textAlign: "left" }}>
          <Avatar name={c.partner?.name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>{c.partner?.name ?? "User"}</div>
            <div style={{ fontSize: 13, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMsg?.content}</div>
          </div>
          <div style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{timeAgo(c.lastMsg?.createdAt, lang)}</div>
        </button>
      ))}
    </div>
  );
}

// ── Leaderboard Panel ─────────────────────────────────────────────────────────
function LeaderboardPanel({ lang }: { lang: string }) {
  const { data: board, isLoading } = trpc.community.getLeaderboard.useQuery();
  const rankColors = [ORANGE, "#C0C0C0", "#CD7F32"];
  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ color: TEXT, fontWeight: 800, fontSize: 16, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Trophy size={18} color={ORANGE} /> {t("leaderboard", lang)}
      </h3>
      {isLoading ? <div style={{ color: MUTED }}>{t("loading", lang)}</div> : (
        (board ?? []).map((entry: any, i: number) => (
          <div key={entry.userId} style={{ background: CARD, border: `1px solid ${i < 3 ? rankColors[i] + "44" : BORDER}`, borderRadius: 14, padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
            <Avatar name={entry.userName} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{entry.userName}</div>
              <div style={{ color: MUTED, fontSize: 11 }}>{lang === "ar" ? entry.titleAr : entry.title} • Lv.{entry.level}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: NAVY, fontWeight: 800, fontSize: 15 }}>{entry.weeklyXp}</div>
              <div style={{ color: MUTED, fontSize: 10 }}>XP</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Challenges Panel ──────────────────────────────────────────────────────────
function ChallengesPanel({ lang }: { lang: string }) {
  const { data: challenges, isLoading } = trpc.community.getChallenges.useQuery();
  const { data: myChallenges } = trpc.community.getMyChallenges.useQuery();
  const utils = trpc.useUtils();
  const [spinChallengeId, setSpinChallengeId] = useState<number | null>(null);
  const joinMutation = trpc.community.joinChallenge.useMutation({ onSuccess: () => { utils.community.getMyChallenges.invalidate(); utils.community.getChallenges.invalidate(); } });
  const completeMutation = trpc.community.completeChallenge.useMutation({
    onSuccess: (data, vars) => { utils.community.getMyChallenges.invalidate(); if (!data.alreadyCompleted) setSpinChallengeId(vars.challengeId); },
  });
  const joinedMap = new Map((myChallenges ?? []).map((c: any) => [c.challengeId, c]));
  return (
    <div style={{ padding: "16px" }}>
      {spinChallengeId !== null && <SpinWheel challengeId={spinChallengeId} lang={lang as "ar" | "en"} onClose={() => setSpinChallengeId(null)} />}
      <h3 style={{ color: TEXT, fontWeight: 800, fontSize: 16, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Flame size={18} color={ORANGE} /> {t("challenges", lang)}
      </h3>
      {isLoading ? <div style={{ color: MUTED }}>{t("loading", lang)}</div> : (
        (challenges ?? []).map((ch: any) => {
          const participation = joinedMap.get(ch.id);
          const joined = !!participation;
          const completed = !!participation?.completedAt;
          const daysLeft = daysUntil(ch.endDate);
          return (
            <div key={ch.id} style={{ background: CARD, border: `1px solid ${completed ? ORANGE + "44" : joined ? GREEN + "44" : BORDER}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
              {completed && <div style={{ position: "absolute", top: 0, right: 0, background: `linear-gradient(135deg, ${ORANGE}, #FF4040)`, color: "white", fontSize: 9, fontWeight: 900, padding: "3px 10px", borderBottomLeftRadius: 8 }}>{lang === "ar" ? "✅ مكتمل" : "✅ DONE"}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: TEXT, fontWeight: 800, fontSize: 14 }}>{lang === "ar" ? ch.titleAr : ch.title}</div>
                  <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{lang === "ar" ? ch.descriptionAr : ch.description}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ color: ORANGE, fontSize: 11 }}>⚡ {ch.xpReward} XP</span>
                    <span style={{ color: MUTED, fontSize: 11 }}>👥 {ch.participantsCount} {t("participants", lang)}</span>
                    <span style={{ color: daysLeft < 3 ? ORANGE : MUTED, fontSize: 11 }}>⏳ {t("endsIn", lang)} {daysLeft} {t("days", lang)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button onClick={() => !joined && joinMutation.mutate({ challengeId: ch.id })} disabled={joined || joinMutation.isPending}
                    style={{ background: joined ? `${GREEN}18` : NAVY, border: `1px solid ${joined ? GREEN : "transparent"}`, borderRadius: 10, padding: "8px 16px", color: joined ? GREEN : "#fff", fontWeight: 800, fontSize: 13, cursor: joined ? "default" : "pointer" }}>
                    {joined ? `✅ ${t("joined", lang)}` : t("join", lang)}
                  </button>
                  {joined && !completed && (
                    <button onClick={() => completeMutation.mutate({ challengeId: ch.id })} disabled={completeMutation.isPending}
                      style={{ background: ORANGE, border: "none", borderRadius: 10, padding: "8px 16px", color: "white", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                      {lang === "ar" ? "🎰 أكملت!" : "🎰 Done!"}
                    </button>
                  )}
                  {completed && (
                    <button onClick={() => setSpinChallengeId(ch.id)}
                      style={{ background: `${ORANGE}12`, border: `1px solid ${ORANGE}44`, borderRadius: 10, padding: "8px 16px", color: ORANGE, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
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
  if (isLoading) return <div style={{ color: MUTED, padding: 16 }}>{t("loading", lang)}</div>;
  if (!xpData) return null;
  const { totalXp, weeklyXp, level, title, titleAr, nextLevelXp, badges } = xpData;
  const progress = nextLevelXp > 0 ? Math.min(100, (totalXp / nextLevelXp) * 100) : 100;
  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ color: TEXT, fontWeight: 800, fontSize: 16, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Star size={18} color={ORANGE} /> {t("myXP", lang)}
      </h3>
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_D})`, borderRadius: 16, padding: "20px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: SKY, fontWeight: 900, fontSize: 30 }}>Lv.{level}</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{lang === "ar" ? titleAr : title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: ORANGE, fontWeight: 800, fontSize: 24 }}>{totalXp}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{t("totalXP", lang)}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.15)", borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${SKY}, ${ORANGE})`, width: `${progress}%`, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{totalXp} XP</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{nextLevelXp} XP</span>
        </div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
          📅 {t("weeklyXP", lang)}: <span style={{ color: GREEN, fontWeight: 700 }}>{weeklyXp}</span>
        </div>
      </div>
      {badges.length > 0 && (
        <div>
          <div style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>🎖️ {t("badges", lang)}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {badges.map((b: any) => (
              <div key={b.id} style={{ background: CARD, border: `1px solid ${ORANGE}33`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ color: TEXT, fontSize: 11, fontWeight: 600 }}>{lang === "ar" ? b.labelAr : b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feed Panel ────────────────────────────────────────────────────────────────
type FeedTab = "for_you" | "following" | "trending";

function FeedPanel({ lang, currentUserId, streak, weeklyCompletion, currentWeight, targetWeight, name, onProfileClick }: {
  lang: string; currentUserId?: number; streak: number; weeklyCompletion: number;
  currentWeight?: number; targetWeight?: number; name?: string;
  onProfileClick: (id: number) => void;
}) {
  const socketCtx = useSocket();
  const [showNewPost, setShowNewPost] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("for_you");
  const [livePosts, setLivePosts] = useState<any[]>([]);
  const { data: meData } = trpc.auth.me.useQuery();
  const currentUser = (meData as any)?.user;

  const { data: feedData, isLoading } = trpc.community.getFeed.useQuery({ limit: 30, offset: 0 });
  const { data: followingFeed } = trpc.community.getFollowingFeed.useQuery({ limit: 30, offset: 0 }, { enabled: feedTab === "following" });

  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return;
    const handler = (post: any) => {
      setLivePosts(prev => prev.find(p => p.id === post.id) ? prev : [post, ...prev]);
    };
    socket.on("new_post", handler);
    return () => { socket.off("new_post", handler); };
  }, [socketCtx?.socket]);

  const forYouPosts = [
    ...livePosts.filter(lp => !(feedData?.posts ?? []).find((p: any) => p.id === lp.id)),
    ...(feedData?.posts ?? []),
  ];
  const trendingPosts = (feedData?.trending ?? forYouPosts).filter((p: any) => (p.likesCount ?? 0) > 0 || p.isTrending);
  const followingPosts = followingFeed?.posts ?? [];

  const displayPosts = feedTab === "for_you" ? forYouPosts
    : feedTab === "following" ? followingPosts
    : trendingPosts.length > 0 ? trendingPosts : forYouPosts;

  return (
    <div>
      {/* Feed sub-tabs */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, display: "flex", position: "sticky", top: 52, zIndex: 40 }}>
        {([["for_you", t("forYou", lang)], ["following", t("following", lang)], ["trending", t("trending", lang)]] as [FeedTab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFeedTab(id)}
            style={{ flex: 1, padding: "13px 0", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: feedTab === id ? 700 : 500, color: feedTab === id ? NAVY : MUTED, borderBottom: feedTab === id ? `2.5px solid ${NAVY}` : "2.5px solid transparent", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Stories */}
      <StoriesBar lang={lang} />

      {/* AI Insight */}
      {currentUserId && (
        <div style={{ padding: "0 16px" }}>
          <AIInsightCard lang={lang} streak={streak} weeklyCompletion={weeklyCompletion} currentWeight={currentWeight} targetWeight={targetWeight} name={name} />
        </div>
      )}

      {/* Composer bar */}
      {currentUserId && (
        <button onClick={() => setShowNewPost(true)} style={{ width: "100%", background: CARD, border: "none", borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Avatar name={name ?? "U"} size={38} />
          <span style={{ flex: 1, background: BG, borderRadius: 20, padding: "9px 16px", color: MUTED, fontSize: 14, textAlign: lang === "ar" ? "right" : "left" }}>
            {t("postPlaceholder", lang)}
          </span>
          <Camera size={20} color={NAVY} />
        </button>
      )}

      {/* Posts */}
      {isLoading ? (
        <div style={{ color: MUTED, textAlign: "center", padding: 40 }}>{t("loading", lang)}</div>
      ) : displayPosts.length === 0 ? (
        <div style={{ color: MUTED, textAlign: "center", padding: 40, fontSize: 14 }}>{t("noFeed", lang)}</div>
      ) : (
        displayPosts.map((post: any) => (
          <PostCard key={post.id} post={post} lang={lang} currentUserId={currentUserId} onProfileClick={onProfileClick} />
        ))
      )}

      {/* FAB */}
      {currentUserId && (
        <button onClick={() => setShowNewPost(true)} aria-label={t("newPost", lang)}
          style={{ position: "fixed", bottom: 80, right: lang === "ar" ? "auto" : 20, left: lang === "ar" ? 20 : "auto", width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${NAVY}, ${SKY})`, color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${NAVY}55`, zIndex: 30 }}>
          <Plus size={24} />
        </button>
      )}

      {showNewPost && <NewPostForm lang={lang} onClose={() => setShowNewPost(false)} currentUser={currentUser} />}
    </div>
  );
}

// ── Main Community Component ──────────────────────────────────────────────────
type CommunityTab = "feed" | "leaderboard" | "challenges" | "xp";
type SubView = "main" | "profile" | "dm_list" | "dm_chat";

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
  const [subView, setSubView] = useState<SubView>("main");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [dmPartnerId, setDmPartnerId] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dmCount } = trpc.community.getUnreadDMCount.useQuery(undefined, { enabled: !!userId });
  const { data: searchResults } = trpc.community.searchUsers.useQuery({ query: searchQuery }, { enabled: searchQuery.length > 1 });

  const handleProfileClick = (uid: number) => { setProfileUserId(uid); setSubView("profile"); };
  const handleDM = (uid: number) => { setDmPartnerId(uid); setSubView("dm_chat"); };

  const tabs: { id: CommunityTab; icon: React.ReactNode; label: keyof typeof T }[] = [
    { id: "feed",        icon: <Globe size={16} />,    label: "feed" },
    { id: "leaderboard", icon: <Trophy size={16} />,   label: "leaderboard" },
    { id: "challenges",  icon: <Flame size={16} />,    label: "challenges" },
    { id: "xp",          icon: <Star size={16} />,     label: "myXP" },
  ];

  // Sub-views
  if (subView === "profile" && profileUserId) {
    return (
      <div style={{ height: "100%", overflow: "auto", fontFamily: isRTL ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif" }} dir={isRTL ? "rtl" : "ltr"}>
        <UserProfileView userId={profileUserId} currentUserId={userId} lang={lang} onBack={() => setSubView("main")} onDM={handleDM} />
      </div>
    );
  }
  if (subView === "dm_list") {
    return (
      <div style={{ height: "100%", overflow: "auto", fontFamily: isRTL ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif" }} dir={isRTL ? "rtl" : "ltr"}>
        <DMListView lang={lang} onBack={() => setSubView("main")} onChat={id => { setDmPartnerId(id); setSubView("dm_chat"); }} />
      </div>
    );
  }
  if (subView === "dm_chat" && dmPartnerId && userId) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: isRTL ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif" }} dir={isRTL ? "rtl" : "ltr"}>
        <DMChatView partnerId={dmPartnerId} currentUserId={userId} lang={lang} onBack={() => setSubView("dm_list")} />
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: BG, fontFamily: isRTL ? "Cairo, Tajawal, sans-serif" : "Inter, system-ui, sans-serif" }}>

      {/* ── Top Bar ── */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ fontWeight: 900, fontSize: 20, color: NAVY }}>{t("community", lang)}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setShowSearch(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 6 }}><Search size={20} /></button>
          <NotificationBell lang={lang} />
          <button onClick={() => setSubView("dm_list")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: NAVY, padding: 6 }}>
            <Send size={20} />
            {(dmCount?.count ?? 0) > 0 && <span style={{ position: "absolute", top: 2, right: 2, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{dmCount!.count}</span>}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ background: CARD, padding: "8px 16px 12px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, borderRadius: 24, padding: "8px 14px" }}>
            <Search size={16} color={MUTED} />
            <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("searchUsers", lang)}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: TEXT }} />
          </div>
          {searchQuery.length > 1 && (
            <div style={{ marginTop: 8 }}>
              {(searchResults ?? []).map((u: any) => (
                <button key={u.id} onClick={() => { handleProfileClick(u.id); setShowSearch(false); setSearchQuery(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", background: "none", border: "none", cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}>
                  <Avatar name={u.name} size={36} />
                  <div style={{ textAlign: isRTL ? "right" : "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{u.name ?? "User"}</div>
                    <div style={{ fontSize: 12, color: MUTED }}>@{(u.name ?? "user").toLowerCase().replace(/\s+/g, ".")}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <div style={{ display: "flex", background: CARD, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 52, zIndex: 49 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "10px 4px", background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab.id ? `2.5px solid ${NAVY}` : "2.5px solid transparent",
            color: activeTab === tab.id ? NAVY : MUTED, fontSize: 11, fontWeight: 700,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s",
          }}>
            {tab.icon}
            <span>{t(tab.label, lang)}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ paddingBottom: 100 }}>
        {activeTab === "feed" && (
          <FeedPanel lang={lang} currentUserId={userId} streak={streak} weeklyCompletion={weeklyCompletion}
            currentWeight={currentWeight} targetWeight={targetWeight} name={name} onProfileClick={handleProfileClick} />
        )}
        {activeTab === "leaderboard" && <LeaderboardPanel lang={lang} />}
        {activeTab === "challenges" && <ChallengesPanel lang={lang} />}
        {activeTab === "xp" && <XPPanel lang={lang} streak={streak} />}
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/**
 * Community Router — social feed, reactions, comments, stories,
 * leaderboard, challenges, XP/levels, and AI insights.
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import {
  getCommunityFeed, getTrendingPosts, createCommunityPost, getPostById,
  incrementPostLikes, incrementPostComments,
  getReaction, addReaction, removeReaction, getReactionsByPost,
  getCommentsByPost, addComment,
  getActiveStories, createStory,
  getActiveChallenges, joinChallenge, getUserChallenges, seedDefaultChallenges,
  addXp, getUserTotalXp, getWeeklyLeaderboard, getUserWeeklyXp,
  getUserByOpenId,
  createSocialNotification,
  getSocialNotifications,
  markNotificationsRead,
  getUnreadNotificationCount,
  followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount, getFollowingIds,
  getUserById, searchUsers,
  sendDirectMessage, getConversation, getConversationList, markMessagesRead, getUnreadDMCount,
  bookmarkPost, unbookmarkPost, isBookmarked, getUserBookmarks,
  getUserPrivacySettings, upsertUserPrivacySettings,
  markSingleNotificationRead, deleteNotification,
} from "../db";
import { getDb } from "../db";
import { users, communityPosts, communityComments, communityChallenges, challengeParticipants, communityReportPosts } from "../../drizzle/schema";
import { eq, like, or, inArray } from "drizzle-orm";
import { getIO } from "../_core/index";
import { getPushSubscriptionByUser, getNotificationSettings } from "../db";
import { sendPushToSubscription } from "./notifications";

// ── XP constants ──────────────────────────────────────────────────────────────
const XP = {
  post: 20,
  imagePost: 35,
  achievementPost: 50,
  like: 5,
  comment: 10,
  joinChallenge: 15,
} as const;

// ── Level thresholds ──────────────────────────────────────────────────────────
function xpToLevel(xp: number): { level: number; title: string; titleAr: string; nextLevelXp: number } {
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
  for (const t of thresholds) {
    if (xp >= t.min) current = t;
    else break;
  }
  const idx = thresholds.indexOf(current);
  const next = thresholds[idx + 1];
  return {
    level: current.level,
    title: current.title,
    titleAr: current.titleAr,
    nextLevelXp: next ? next.min : current.min,
  };
}

// ── Badges ────────────────────────────────────────────────────────────────────
function getBadges(totalXp: number, streak: number, postCount: number): { id: string; label: string; labelAr: string; icon: string }[] {
  const badges = [];
  if (totalXp >= 100)  badges.push({ id: "first100",  label: "First 100 XP",    labelAr: "أول 100 نقطة",   icon: "⭐" });
  if (totalXp >= 500)  badges.push({ id: "xp500",     label: "500 XP Club",     labelAr: "نادي 500 نقطة",  icon: "🏅" });
  if (totalXp >= 1000) badges.push({ id: "xp1000",    label: "1K XP Legend",    labelAr: "أسطورة 1000",    icon: "🏆" });
  if (streak >= 3)     badges.push({ id: "streak3",   label: "3-Day Streak",    labelAr: "سلسلة 3 أيام",   icon: "🔥" });
  if (streak >= 7)     badges.push({ id: "streak7",   label: "Week Warrior",    labelAr: "محارب الأسبوع",  icon: "💪" });
  if (streak >= 30)    badges.push({ id: "streak30",  label: "Iron Discipline", labelAr: "انضباط حديدي",   icon: "🦾" });
  if (postCount >= 1)  badges.push({ id: "firstpost", label: "First Post",      labelAr: "أول منشور",      icon: "📸" });
  if (postCount >= 10) badges.push({ id: "posts10",   label: "Content Creator", labelAr: "صانع محتوى",     icon: "🎯" });
  return badges;
}

// ── Router ────────────────────────────────────────────────────────────────────
export const communityRouter = router({

  /** Get paginated public feed */
  getFeed: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const [posts, trending] = await Promise.all([
        getCommunityFeed(input.limit, input.offset),
        getTrendingPosts(3),
      ]);
      // Enrich with user names
      const db = await getDb();
      const allPosts = [...trending.filter(t => !posts.find(p => p.id === t.id)), ...posts];
      if (!db) return { posts: allPosts, trending };
      const userIds = Array.from(new Set(allPosts.map(p => p.userId)));
      const userRows = userIds.length > 0
        ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds))
        : [];
      const userMap = Object.fromEntries(userRows.map(u => [u.id, u.name ?? "User"]));
      return {
        posts: allPosts.map(p => ({ ...p, userName: userMap[p.userId] ?? "User" })),
        trending: trending.map(p => ({ ...p, userName: userMap[p.userId] ?? "User" })),
      };
    }),

  /** Create a post (text, image, achievement) */
  createPost: protectedProcedure
    .input(z.object({
      type: z.enum(["text", "image", "achievement", "transformation", "auto"]).default("text"),
      content: z.string().min(1).max(2000),
      contentEn: z.string().max(2000).optional(),
      imageBase64: z.string().optional(), // base64 encoded image
      imageMime: z.string().optional(),
      visibility: z.enum(["public", "friends", "private"]).default("public"),
    }))
    .mutation(async ({ ctx, input }) => {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;
      if (input.imageBase64 && input.imageMime) {
        const buf = Buffer.from(input.imageBase64, "base64");
        const ext = input.imageMime.split("/")[1] ?? "jpg";
        const key = `community/${ctx.user.id}/${Date.now()}.${ext}`;
        const result = await storagePut(key, buf, input.imageMime);
        imageUrl = result.url;
        imageKey = result.key;
      }
      const xpAward = input.type === "image" || input.type === "transformation" ? XP.imagePost
        : input.type === "achievement" || input.type === "auto" ? XP.achievementPost
        : XP.post;
      const post = await createCommunityPost({
        userId: ctx.user.id,
        type: input.type,
        content: input.content,
        contentEn: input.contentEn,
        imageUrl,
        imageKey,
        visibility: input.visibility,
        xpAwarded: xpAward,
        likesCount: 0,
        commentsCount: 0,
        isTrending: false,
      });
      await addXp({ userId: ctx.user.id, event: "post", points: xpAward });

      // ── Broadcast new post to all connected users ─────────────────────────
      try {
        const db = await getDb();
        const actor = db ? await db.select({ name: users.name })
          .from(users).where(eq(users.id, ctx.user.id)).limit(1) : [];
        const io = getIO();
        io?.emit("new_post", {
          ...post,
          userName: actor[0]?.name ?? "User",
        });
      } catch (e) { /* non-fatal */ }

      return post;
    }),

  /** Toggle reaction (like/cheer/fire) on a post */
  reactToPost: protectedProcedure
    .input(z.object({
      postId: z.number(),
      type: z.enum(["like", "cheer", "fire"]).default("like"),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getReaction(input.postId, ctx.user.id);
      if (existing) {
        await removeReaction(input.postId, ctx.user.id);
        await incrementPostLikes(input.postId, -1);
        return { reacted: false };
      }
      await addReaction({ postId: input.postId, userId: ctx.user.id, type: input.type });
      await incrementPostLikes(input.postId, 1);
      await addXp({ userId: ctx.user.id, event: "like", points: XP.like, refId: input.postId });

      // ── Real-time: notify post author ─────────────────────────────────────
      try {
        const db = await getDb();
        if (db) {
          const posts = await db.select({ userId: communityPosts.userId })
            .from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
          const postAuthorId = posts[0]?.userId;

          if (postAuthorId && postAuthorId !== ctx.user.id) {
            const actor = await db.select({ name: users.name })
              .from(users).where(eq(users.id, ctx.user.id)).limit(1);
            const actorName = actor[0]?.name ?? "Someone";
            const icons = { like: "❤️", cheer: "💪", fire: "🔥" };
            const icon = icons[input.type];

            // Save to DB
            await createSocialNotification({
              userId: postAuthorId,
              actorId: ctx.user.id,
              type: input.type,
              postId: input.postId,
              message: `${icon} ${actorName} تفاعل مع منشورك`,
              messageEn: `${icon} ${actorName} reacted to your post`,
            });

            // Emit via socket.io
            const io = getIO();
            io?.to(`user:${postAuthorId}`).emit("notification", {
              type: input.type,
              message: `${icon} ${actorName} reacted to your post`,
              postId: input.postId,
            });

            // Web Push (if subscribed)
            const sub = await getPushSubscriptionByUser(postAuthorId);
            const settings = await getNotificationSettings(postAuthorId);
            if (sub && settings?.communityNotifs !== false) {
              const lang = settings?.language ?? "ar";
              await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
                title: "Prime Fit",
                body: lang === "ar" ? `${icon} ${actorName} تفاعل مع منشورك` : `${icon} ${actorName} reacted to your post`,
                icon: "/icons/icon-192.png",
                url: "/community",
              });
            }
          }
        }
      } catch (e) { /* non-fatal */ }

      return { reacted: true, type: input.type };
    }),

  /** Get my reaction on a post */
  getMyReaction: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getReaction(input.postId, ctx.user.id);
    }),

  /** Get all reactions on a post */
  getReactions: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return getReactionsByPost(input.postId);
    }),

  /** Get comments for a post */
  getComments: publicProcedure
    .input(z.object({ postId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const comments = await getCommentsByPost(input.postId, input.limit);
      const db = await getDb();
      if (!db || comments.length === 0) return comments;
      const userIds = Array.from(new Set(comments.map(c => c.userId)));
      const userRows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
      const userMap = Object.fromEntries(userRows.map(u => [u.id, u.name ?? "User"]));
      return comments.map(c => ({ ...c, userName: userMap[c.userId] ?? "User" }));
    }),

  /** Add a comment */
  addComment: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await addComment({ postId: input.postId, userId: ctx.user.id, content: input.content });
      await incrementPostComments(input.postId);
      await addXp({ userId: ctx.user.id, event: "comment", points: XP.comment, refId: input.postId });

      // ── Real-time: notify post author ─────────────────────────────────────
      try {
        const db = await getDb();
        if (db) {
          const posts = await db.select({ userId: communityPosts.userId })
            .from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
          const postAuthorId = posts[0]?.userId;

          if (postAuthorId && postAuthorId !== ctx.user.id) {
            const actor = await db.select({ name: users.name })
              .from(users).where(eq(users.id, ctx.user.id)).limit(1);
            const actorName = actor[0]?.name ?? "Someone";

            await createSocialNotification({
              userId: postAuthorId,
              actorId: ctx.user.id,
              type: "comment",
              postId: input.postId,
              message: `💬 ${actorName} علّق على منشورك`,
              messageEn: `💬 ${actorName} commented on your post`,
            });

            const io = getIO();
            io?.to(`user:${postAuthorId}`).emit("notification", {
              type: "comment",
              message: `💬 ${actorName} commented on your post`,
              postId: input.postId,
            });

            const sub = await getPushSubscriptionByUser(postAuthorId);
            const settings = await getNotificationSettings(postAuthorId);
            if (sub && settings?.communityNotifs !== false) {
              const lang = settings?.language ?? "ar";
              await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
                title: "Prime Fit",
                body: lang === "ar" ? `💬 ${actorName} علّق على منشورك` : `💬 ${actorName} commented on your post`,
                icon: "/icons/icon-192.png",
                url: "/community",
              });
            }
          }
        }
      } catch (e) { /* non-fatal */ }

      return { success: true };
    }),

  /** Get active stories */
  getStories: publicProcedure.query(async () => {
    const stories = await getActiveStories();
    const db = await getDb();
    if (!db || stories.length === 0) return stories;
      const userIds = Array.from(new Set(stories.map(s => s.userId)));
    const userRows = await db.select({ id: users.id, name: users.name }).from(users);
    const userMap = Object.fromEntries(userRows.map(u => [u.id, u.name ?? "User"]));
    return stories.map(s => ({ ...s, userName: userMap[s.userId] ?? "User" }));
  }),

  /** Get active challenges */
  getChallenges: publicProcedure.query(async () => {
    await seedDefaultChallenges();
    return getActiveChallenges();
  }),

  /** Join a challenge */
  joinChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await joinChallenge({ challengeId: input.challengeId, userId: ctx.user.id, progress: 0 });
      await addXp({ userId: ctx.user.id, event: "joinChallenge", points: XP.joinChallenge, refId: input.challengeId });
      return result;
    }),

  /** Get challenges I've joined */
  getMyChallenges: protectedProcedure.query(async ({ ctx }) => {
    return getUserChallenges(ctx.user.id);
  }),

  /** Get my XP, level, and badges */
  getMyXP: protectedProcedure
    .input(z.object({
      streak: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const [totalXp, weeklyXp] = await Promise.all([
        getUserTotalXp(ctx.user.id),
        getUserWeeklyXp(ctx.user.id),
      ]);
      // Count posts
      const db = await getDb();
      let postCount = 0;
      if (db) {
        const { count } = await import("drizzle-orm");
        const rows = await db.select({ c: count() }).from(communityPosts)
          .where(eq(communityPosts.userId, ctx.user.id));
        postCount = Number(rows[0]?.c ?? 0);
      }
      const levelInfo = xpToLevel(totalXp);
      const badges = getBadges(totalXp, input.streak, postCount);
      return { totalXp, weeklyXp, ...levelInfo, badges, postCount };
    }),

  /** Get weekly leaderboard */
  getLeaderboard: publicProcedure.query(async () => {
    const rows = await getWeeklyLeaderboard(10);
    if (rows.length === 0) return [];
    const db = await getDb();
    if (!db) return rows;
    const userRows = await db.select({ id: users.id, name: users.name }).from(users);
    const userMap = Object.fromEntries(userRows.map(u => [u.id, u.name ?? "User"]));
    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      userName: userMap[r.userId] ?? "User",
      weeklyXp: r.weeklyXp,
      ...xpToLevel(r.weeklyXp),
    }));
  }),

  /** Generate personalized AI insight card */
  getAIInsight: protectedProcedure
    .input(z.object({
      lang: z.enum(["ar", "en"]).default("ar"),
      streak: z.number().default(0),
      weeklyCompletion: z.number().default(0),
      currentWeight: z.number().optional(),
      targetWeight: z.number().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [totalXp, weeklyXp, leaderboard] = await Promise.all([
        getUserTotalXp(ctx.user.id),
        getUserWeeklyXp(ctx.user.id),
        getWeeklyLeaderboard(10),
      ]);
      const rank = leaderboard.findIndex(r => r.userId === ctx.user.id) + 1;
      const rankText = rank > 0 ? `ranked #${rank} on the weekly leaderboard` : "not yet on the weekly leaderboard";
      const weightText = input.currentWeight && input.targetWeight
        ? `Current weight: ${input.currentWeight}kg, target: ${input.targetWeight}kg`
        : "";
      const prompt = input.lang === "ar"
        ? `أنت مدرب لياقة بدنية ذكي داخل تطبيق Prime Fit. قم بإنشاء رسالة تحفيزية قصيرة وشخصية (جملتان فقط) باللغة العربية للمستخدم ${input.name ?? "المستخدم"}.
معلومات المستخدم: سلسلة ${input.streak} يوم، إكمال أسبوعي ${input.weeklyCompletion}%، ${weeklyXp} نقطة هذا الأسبوع، إجمالي ${totalXp} نقطة، ${rankText}. ${weightText}
اجعل الرسالة محددة وتحفيزية وذات صلة بالبيانات. استخدم إيموجي واحد فقط.`
        : `You are an AI fitness coach inside Prime Fit. Generate a short personalized motivational insight (2 sentences max) in English for user ${input.name ?? "the user"}.
User data: ${input.streak}-day streak, ${input.weeklyCompletion}% weekly completion, ${weeklyXp} XP this week, ${totalXp} total XP, ${rankText}. ${weightText}
Make it specific, data-driven, and motivating. Use exactly one emoji.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an elite AI fitness community coach. Keep responses concise and motivating." },
          { role: "user", content: prompt },
        ],
      });
      const content = response.choices?.[0]?.message?.content ?? (
        input.lang === "ar" ? "استمر في التقدم! كل تمرين يقربك من هدفك 💪" : "Keep pushing forward! Every workout brings you closer to your goal 💪"
      );
      return { content, totalXp, weeklyXp, rank: rank > 0 ? rank : null };
    }),

  /** Get my social notifications */
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return getSocialNotifications(ctx.user.id, 30);
  }),

  /** Get unread notification count */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationCount(ctx.user.id);
    return { count };
  }),

  /** Mark all notifications as read */
  markNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  /** Auto-generate an achievement post (called from client on milestone) */
  autoGeneratePost: protectedProcedure
    .input(z.object({
      milestone: z.enum(["streak7", "streak30", "level_up", "challenge_complete", "weight_goal"]),
      lang: z.enum(["ar", "en"]).default("ar"),
      name: z.string().optional(),
      value: z.number().optional(), // streak count, level number, etc.
    }))
    .mutation(async ({ ctx, input }) => {
      const templates: Record<string, { ar: string; en: string }> = {
        streak7:            { ar: `🔥 ${input.name ?? "المستخدم"} أكمل 7 أيام متتالية من التمارين!`, en: `🔥 ${input.name ?? "User"} completed a 7-day workout streak!` },
        streak30:           { ar: `🦾 ${input.name ?? "المستخدم"} وصل إلى 30 يوم متتالي — انضباط حديدي!`, en: `🦾 ${input.name ?? "User"} hit a 30-day streak — Iron Discipline!` },
        level_up:           { ar: `⭐ ${input.name ?? "المستخدم"} وصل إلى المستوى ${input.value ?? ""}!`, en: `⭐ ${input.name ?? "User"} reached Level ${input.value ?? ""}!` },
        challenge_complete: { ar: `🏆 ${input.name ?? "المستخدم"} أكمل التحدي بنجاح!`, en: `🏆 ${input.name ?? "User"} completed the challenge!` },
        weight_goal:        { ar: `🎯 ${input.name ?? "المستخدم"} وصل إلى وزن الهدف!`, en: `🎯 ${input.name ?? "User"} reached their weight goal!` },
      };
      const t = templates[input.milestone];
      const content = input.lang === "ar" ? t.ar : t.en;
      const post = await createCommunityPost({
        userId: ctx.user.id,
        type: "auto",
        content,
        contentEn: t.en,
        visibility: "public",
        xpAwarded: XP.achievementPost,
        likesCount: 0,
        commentsCount: 0,
        isTrending: false,
      });
      await addXp({ userId: ctx.user.id, event: "post", points: XP.achievementPost });
      return post;
    }),

  /** Delete a post (owner or admin only) */
  deletePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(communityPosts).where(eq(communityPosts.id, input.postId));
      return { success: true };
    }),

  /** Edit a post (owner only) */
  editPost: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(communityPosts).set({ content: input.content }).where(eq(communityPosts.id, input.postId));
      return { success: true };
    }),

  /** Delete a comment (owner or admin only) */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, input.commentId)).limit(1);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(communityComments).where(eq(communityComments.id, input.commentId));
      return { success: true };
    }),

  /** Edit a comment (owner only) */
  editComment: protectedProcedure
    .input(z.object({ commentId: z.number(), content: z.string().min(1).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [comment] = await db.select().from(communityComments).where(eq(communityComments.id, input.commentId)).limit(1);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(communityComments).set({ content: input.content }).where(eq(communityComments.id, input.commentId));
      return { success: true };
    }),

  /** Mark a challenge as completed for the current user */
  completeChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db.select().from(challengeParticipants)
        .where(eq(challengeParticipants.challengeId, input.challengeId))
        .limit(1);
      if (existing?.completedAt) return { success: true, alreadyCompleted: true };
      if (existing) {
        await db.update(challengeParticipants)
          .set({ completedAt: new Date(), progress: 100 })
          .where(eq(challengeParticipants.id, existing.id));
      } else {
        await db.insert(challengeParticipants).values({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          progress: 100,
          completedAt: new Date(),
        });
      }
      await addXp({ userId: ctx.user.id, event: "joinChallenge", points: 50, refId: input.challengeId });
      return { success: true, alreadyCompleted: false };
    }),

  /** Get mention suggestions for @username autocomplete */
  getMentionSuggestions: protectedProcedure
    .input(z.object({ query: z.string().max(50) }))
    .query(async ({ input }) => {
      if (!input.query.trim()) return [];
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(like(users.name, `%${input.query}%`))
        .limit(8);
      return rows.map(u => ({ id: u.id, name: u.name ?? "User", avatarUrl: u.avatarUrl }));
    }),

  /** Create a new challenge (admin only) */
  createChallenge: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      titleAr: z.string().min(1).max(200),
      description: z.string().max(1000).default(""),
      descriptionAr: z.string().max(1000).default(""),
      xpReward: z.number().min(0).max(1000).default(100),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      type: z.enum(["streak", "sessions", "cardio", "weight", "custom"]).default("custom"),
      targetValue: z.number().min(1).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const today = new Date().toISOString().slice(0, 10);
      const [challenge] = await db.insert(communityChallenges).values({
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        xpReward: input.xpReward,
        startDate: input.startDate ?? today,
        endDate: input.endDate ?? today,
        type: input.type,
        targetValue: input.targetValue,
        isActive: true,
        participantsCount: 0,
      }).returning({ id: communityChallenges.id });
      return { success: true, id: challenge.id };
    }),

  // ── Follow System ─────────────────────────────────────────────────────────

  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot follow yourself" });
      await followUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await unfollowUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      return { following: await isFollowing(ctx.user.id, input.userId) };
    }),

  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const db = await getDb();
      const postCount = db ? (await db.select().from(communityPosts).where(eq(communityPosts.userId, input.userId))).length : 0;
      const [followers, following] = await Promise.all([
        getFollowerCount(input.userId),
        getFollowingCount(input.userId),
      ]);
      const isFollowingUser = ctx?.user ? await isFollowing(ctx.user.id, input.userId) : false;
      return { ...user, postCount, followers, following, isFollowing: isFollowingUser };
    }),

  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return searchUsers(input.query, 10);
    }),

  // ── Direct Messages ───────────────────────────────────────────────────────

  sendDM: protectedProcedure
    .input(z.object({ receiverId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      if (input.receiverId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST" });
      const id = await sendDirectMessage({ senderId: ctx.user.id, receiverId: input.receiverId, content: input.content, isRead: false });
      // Real-time socket emit
      try {
        const io = getIO();
        io?.to(`user:${input.receiverId}`).emit("new_dm", { senderId: ctx.user.id, content: input.content });
      } catch (e) { /* non-fatal */ }
      return { success: true, id };
    }),

  getDMConversation: protectedProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(async ({ ctx, input }) => {
      await markMessagesRead(input.partnerId, ctx.user.id);
      const messages = await getConversation(ctx.user.id, input.partnerId);
      const partner = await getUserById(input.partnerId);
      return { messages, partner };
    }),

  getDMList: protectedProcedure.query(async ({ ctx }) => {
    const convos = await getConversationList(ctx.user.id);
    const enriched = await Promise.all(convos.map(async c => {
      const partner = await getUserById(c.partnerId);
      return { ...c, partner };
    }));
    return enriched;
  }),

  getUnreadDMCount: protectedProcedure.query(async ({ ctx }) => {
    return { count: await getUnreadDMCount(ctx.user.id) };
  }),

  // ── Bookmarks ─────────────────────────────────────────────────────────────

  bookmarkPost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await bookmarkPost(ctx.user.id, input.postId);
      return { success: true };
    }),

  unbookmarkPost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await unbookmarkPost(ctx.user.id, input.postId);
      return { success: true };
    }),

  isBookmarked: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return { bookmarked: await isBookmarked(ctx.user.id, input.postId) };
    }),

  getMyBookmarks: protectedProcedure.query(async ({ ctx }) => {
    const postIds = await getUserBookmarks(ctx.user.id);
    if (postIds.length === 0) return [];
    const db = await getDb();
    if (!db) return [];
    const { inArray } = await import('drizzle-orm');
    const posts = await db.select().from(communityPosts).where(inArray(communityPosts.id, postIds));
    return posts;
  }),

  // ── Following Feed ────────────────────────────────────────────────────────

  getFollowingFeed: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const followingIds = await getFollowingIds(ctx.user.id);
      if (followingIds.length === 0) return { posts: [] };
      const db = await getDb();
      if (!db) return { posts: [] };
      const { inArray, desc: descOp } = await import('drizzle-orm');
      const posts = await db.select().from(communityPosts)
        .where(inArray(communityPosts.userId, followingIds))
        .orderBy(descOp(communityPosts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const userRows = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users);
      const userMap = Object.fromEntries(userRows.map(u => [u.id, { name: u.name ?? 'User', avatarUrl: u.avatarUrl }]));
      return { posts: posts.map(p => ({ ...p, userName: userMap[p.userId]?.name ?? 'User', userAvatar: userMap[p.userId]?.avatarUrl })) };
    }),

  // ── Admin Community Procedures ──────────────────────────────────────────────
  adminGetAllPosts: adminProcedure
    .input(z.object({
      limit: z.number().default(30),
      offset: z.number().default(0),
      filter: z.enum(['all', 'reported', 'hidden', 'pinned']).default('all'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { posts: [], total: 0 };
      const { desc: descOp, eq: eqOp } = await import('drizzle-orm');
      let whereClause: any = undefined;
      if (input.filter === 'hidden') whereClause = eqOp(communityPosts.isHidden, true);
      else if (input.filter === 'pinned') whereClause = eqOp(communityPosts.isPinned, true);
      const posts = await db.select({
        id: communityPosts.id, userId: communityPosts.userId, content: communityPosts.content,
        type: communityPosts.type, imageUrl: communityPosts.imageUrl, visibility: communityPosts.visibility,
        likesCount: communityPosts.likesCount, commentsCount: communityPosts.commentsCount,
        isTrending: communityPosts.isTrending, isPinned: communityPosts.isPinned, isHidden: communityPosts.isHidden,
        createdAt: communityPosts.createdAt,
        userName: users.name, userEmail: users.email, userAvatar: users.avatarUrl,
      })
        .from(communityPosts)
        .leftJoin(users, eqOp(communityPosts.userId, users.id))
        .where(whereClause)
        .orderBy(descOp(communityPosts.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return { posts, total: posts.length };
    }),

  adminDeletePost: adminProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.delete(communityComments).where(eqOp(communityComments.postId, input.postId));
      await db.delete(communityPosts).where(eqOp(communityPosts.id, input.postId));
      return { success: true };
    }),

  adminPinPost: adminProcedure
    .input(z.object({ postId: z.number(), isPinned: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.update(communityPosts).set({ isPinned: input.isPinned }).where(eqOp(communityPosts.id, input.postId));
      return { success: true };
    }),

  adminHidePost: adminProcedure
    .input(z.object({ postId: z.number(), isHidden: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.update(communityPosts).set({ isHidden: input.isHidden }).where(eqOp(communityPosts.id, input.postId));
      return { success: true };
    }),

  adminGetAllUsers: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), search: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { users: [] };
      const { desc: descOp, or: orOp, like: likeOp } = await import('drizzle-orm');
      let whereClause: any = undefined;
      if (input.search) {
        whereClause = orOp(likeOp(users.name, `%${input.search}%`), likeOp(users.email, `%${input.search}%`));
      }
      const rows = await db.select({
        id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl,
        role: users.role, isBanned: users.isBanned, bannedAt: users.bannedAt, banReason: users.banReason,
        createdAt: users.createdAt, lastSignedIn: users.lastSignedIn,
      })
        .from(users)
        .where(whereClause)
        .orderBy(descOp(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      return { users: rows };
    }),

  adminBanUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.update(users).set({ isBanned: true, bannedAt: new Date(), banReason: input.reason ?? null }).where(eqOp(users.id, input.userId));
      return { success: true };
    }),

  adminUnbanUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.update(users).set({ isBanned: false, bannedAt: null, banReason: null }).where(eqOp(users.id, input.userId));
      return { success: true };
    }),

  reportPost: protectedProcedure
    .input(z.object({ postId: z.number(), reason: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.insert(communityReportPosts).values({ postId: input.postId, reporterId: ctx.user.id, reason: input.reason });
      return { success: true };
    }),

  adminGetReports: adminProcedure
    .input(z.object({ status: z.enum(['pending', 'resolved', 'dismissed', 'all']).default('pending') }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { desc: descOp, eq: eqOp } = await import('drizzle-orm');
      let whereClause: any = undefined;
      if (input.status !== 'all') whereClause = eqOp(communityReportPosts.status, input.status as any);
      const reports = await db.select({
        id: communityReportPosts.id, postId: communityReportPosts.postId,
        reason: communityReportPosts.reason, status: communityReportPosts.status,
        adminNote: communityReportPosts.adminNote, createdAt: communityReportPosts.createdAt,
        reporterName: users.name, reporterEmail: users.email,
        postContent: communityPosts.content,
      })
        .from(communityReportPosts)
        .leftJoin(users, eqOp(communityReportPosts.reporterId, users.id))
        .leftJoin(communityPosts, eqOp(communityReportPosts.postId, communityPosts.id))
        .where(whereClause)
        .orderBy(descOp(communityReportPosts.createdAt));
      return reports;
    }),

  adminResolveReport: adminProcedure
    .input(z.object({ reportId: z.number(), status: z.enum(['resolved', 'dismissed']), adminNote: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { eq: eqOp } = await import('drizzle-orm');
      await db.update(communityReportPosts)
        .set({ status: input.status, adminNote: input.adminNote ?? null, resolvedAt: new Date() })
        .where(eqOp(communityReportPosts.id, input.reportId));
      return { success: true };
    }),

  adminGetCommunityStats: adminProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { totalPosts: 0, totalUsers: 0, pendingReports: 0, hiddenPosts: 0, bannedUsers: 0 };
      const { count, eq: eqOp } = await import('drizzle-orm');
      const [postsCount] = await db.select({ count: count() }).from(communityPosts);
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [reportsCount] = await db.select({ count: count() }).from(communityReportPosts).where(eqOp(communityReportPosts.status, 'pending'));
      const [hiddenCount] = await db.select({ count: count() }).from(communityPosts).where(eqOp(communityPosts.isHidden, true));
      const [bannedCount] = await db.select({ count: count() }).from(users).where(eqOp(users.isBanned, true));
      return {
        totalPosts: postsCount?.count ?? 0,
        totalUsers: usersCount?.count ?? 0,
        pendingReports: reportsCount?.count ?? 0,
        hiddenPosts: hiddenCount?.count ?? 0,
        bannedUsers: bannedCount?.count ?? 0,
      };
    }),

  // ── Privacy Settings ─────────────────────────────────────────────────────
  /** Get my privacy settings */
  getPrivacySettings: protectedProcedure
    .query(async ({ ctx }) => {
      const settings = await getUserPrivacySettings(ctx.user.id);
      // Return defaults if not set
      return settings ?? {
        id: 0, userId: ctx.user.id,
        allowDMs: true, allowFollows: true, allowMentions: true, privateAccount: false,
        notifyLikes: true, notifyComments: true, notifyMentions: true,
        notifyFollows: true, notifyMessages: true, notifyReplies: true,
        createdAt: new Date(), updatedAt: new Date(),
      };
    }),

  /** Update my privacy settings */
  updatePrivacySettings: protectedProcedure
    .input(z.object({
      allowDMs: z.boolean().optional(),
      allowFollows: z.boolean().optional(),
      allowMentions: z.boolean().optional(),
      privateAccount: z.boolean().optional(),
      notifyLikes: z.boolean().optional(),
      notifyComments: z.boolean().optional(),
      notifyMentions: z.boolean().optional(),
      notifyFollows: z.boolean().optional(),
      notifyMessages: z.boolean().optional(),
      notifyReplies: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserPrivacySettings(ctx.user.id);
      await upsertUserPrivacySettings({
        userId: ctx.user.id,
        allowDMs: input.allowDMs ?? existing?.allowDMs ?? true,
        allowFollows: input.allowFollows ?? existing?.allowFollows ?? true,
        allowMentions: input.allowMentions ?? existing?.allowMentions ?? true,
        privateAccount: input.privateAccount ?? existing?.privateAccount ?? false,
        notifyLikes: input.notifyLikes ?? existing?.notifyLikes ?? true,
        notifyComments: input.notifyComments ?? existing?.notifyComments ?? true,
        notifyMentions: input.notifyMentions ?? existing?.notifyMentions ?? true,
        notifyFollows: input.notifyFollows ?? existing?.notifyFollows ?? true,
        notifyMessages: input.notifyMessages ?? existing?.notifyMessages ?? true,
        notifyReplies: input.notifyReplies ?? existing?.notifyReplies ?? true,
      });
      return { success: true };
    }),

  // ── Enhanced Notification Actions ────────────────────────────────────────
  /** Mark a single notification as read */
  markOneNotificationRead: protectedProcedure
    .input(z.object({ notifId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markSingleNotificationRead(input.notifId, ctx.user.id);
      return { success: true };
    }),

  /** Delete a notification */
  deleteNotification: protectedProcedure
    .input(z.object({ notifId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteNotification(input.notifId, ctx.user.id);
      return { success: true };
    }),

  /** Get notifications with follow/DM/reply types */
  getNotificationsV2: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return getSocialNotifications(ctx.user.id, input.limit);
    }),
});

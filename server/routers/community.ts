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
} from "../db";
import { getDb } from "../db";
import { users, communityPosts, communityComments, postMentions, communityChallenges } from "../../drizzle/schema";
import { eq, like, sql, desc } from "drizzle-orm";
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
        ? await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users)
        : [];
      const userMap = Object.fromEntries(userRows.map(u => [u.id, { name: u.name ?? "User", avatarUrl: u.avatarUrl ?? null }]));
      return {
        posts: allPosts.map(p => ({ ...p, userName: userMap[p.userId]?.name ?? "User", userAvatar: userMap[p.userId]?.avatarUrl ?? null })),
        trending: trending.map(p => ({ ...p, userName: userMap[p.userId]?.name ?? "User", userAvatar: userMap[p.userId]?.avatarUrl ?? null })),
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

      // ── Process @mentions in post content ──────────────────────────────────────
      if (post.id) {
        processMentions({ content: input.content, actorId: ctx.user.id, postId: post.id })
          .catch(() => { /* non-fatal */ });
      }

      // ── Broadcast new post to all connected users ─────────────────────
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
            if (sub) {
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
      const userRows = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users);
      const userMap = Object.fromEntries(userRows.map(u => [u.id, { name: u.name ?? "User", avatarUrl: u.avatarUrl ?? null }]));
      return comments.map(c => ({ ...c, userName: userMap[c.userId]?.name ?? "User", userAvatar: userMap[c.userId]?.avatarUrl ?? null }));
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
            if (sub) {
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

      // ── Process @mentions in comment ─────────────────────────────────────────
      processMentions({ content: input.content, actorId: ctx.user.id, postId: input.postId })
        .catch(() => { /* non-fatal */ });

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
        const { communityPosts } = await import("../../drizzle/schema");
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

  /** Delete own post (owner or admin) */
  deletePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select({ userId: communityPosts.userId })
        .from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      if (rows[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }
      await db.delete(communityPosts).where(eq(communityPosts.id, input.postId));
      return { success: true };
    }),

  /** Edit own post text (owner or admin) */
  editPost: protectedProcedure
    .input(z.object({ postId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select({ userId: communityPosts.userId })
        .from(communityPosts).where(eq(communityPosts.id, input.postId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      if (rows[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your post" });
      }
      await db.update(communityPosts)
        .set({ content: input.content })
        .where(eq(communityPosts.id, input.postId));
      return { success: true };
    }),

  /** Delete own comment (owner or admin) */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select({ userId: communityComments.userId, postId: communityComments.postId })
        .from(communityComments).where(eq(communityComments.id, input.commentId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      if (rows[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your comment" });
      }
      await db.delete(communityComments).where(eq(communityComments.id, input.commentId));
      await db.update(communityPosts)
        .set({ commentsCount: sql`GREATEST(${communityPosts.commentsCount} - 1, 0)` })
        .where(eq(communityPosts.id, rows[0].postId));
      return { success: true };
    }),

  /** Edit own comment text (owner or admin) */
  editComment: protectedProcedure
    .input(z.object({ commentId: z.number(), content: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select({ userId: communityComments.userId })
        .from(communityComments).where(eq(communityComments.id, input.commentId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
      if (rows[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your comment" });
      }
      await db.update(communityComments)
        .set({ content: input.content })
        .where(eq(communityComments.id, input.commentId));
      return { success: true };
    }),

  /** Get @mention suggestions — fuzzy search by any position in name (Arabic + English) */
  getMentionSuggestions: protectedProcedure
    .input(z.object({ query: z.string().min(0).max(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const q = input.query.trim();
      if (!q) {
        // No query — return suggested users (most recently active, excluding self)
        const rows = await db
          .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
          .from(users)
          .orderBy(desc(users.lastSignedIn))
          .limit(8);
        return rows.filter(r => r.name && r.id !== ctx.user.id);
      }
      // Fuzzy: prefix match first, then contains match
      const prefixRows = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(like(users.name, `${q}%`))
        .limit(8);
      const containsRows = await db
        .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
        .from(users)
        .where(like(users.name, `%${q}%`))
        .limit(12);
      // Merge: prefix first, then contains (dedup by id, exclude self)
      const seen = new Set<number>();
      const merged: { id: number; name: string | null; avatarUrl: string | null }[] = [];
      for (const r of [...prefixRows, ...containsRows]) {
        if (r.name && r.id !== ctx.user.id && !seen.has(r.id)) {
          seen.add(r.id);
          merged.push(r);
        }
        if (merged.length >= 8) break;
      }
      return merged;
    }),

  /** Complete a challenge and mark completedAt for spin wheel eligibility */
  completeChallenge: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { challengeParticipants } = await import("../../drizzle/schema");
      const { and } = await import("drizzle-orm");
      const [participation] = await db
        .select()
        .from(challengeParticipants)
        .where(and(
          eq(challengeParticipants.challengeId, input.challengeId),
          eq(challengeParticipants.userId, ctx.user.id),
        ))
        .limit(1);
      if (!participation) throw new TRPCError({ code: "NOT_FOUND", message: "Not joined" });
      if (participation.completedAt) return { alreadyCompleted: true };
      await db.update(challengeParticipants)
        .set({ completedAt: new Date() })
        .where(and(
          eq(challengeParticipants.challengeId, input.challengeId),
          eq(challengeParticipants.userId, ctx.user.id),
        ));
      return { alreadyCompleted: false };
    }),

  /** Get suggested users to mention (recent active users, excluding self) */
  getSuggestedMentions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .orderBy(desc(users.lastSignedIn))
      .limit(6);
    return rows.filter(r => r.name && r.id !== ctx.user.id);
  }),
  /** Admin: create a new challenge */
  createChallenge: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      titleAr: z.string().min(1),
      description: z.string().default(""),
      descriptionAr: z.string().default(""),
      xpReward: z.number().int().min(1).default(100),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(["streak", "sessions", "cardio", "weight", "custom"]).default("custom"),
      targetValue: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const today = new Date().toISOString().slice(0, 10);
      await db.insert(communityChallenges).values({
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        xpReward: input.xpReward,
        startDate: today,
        endDate: input.endDate,
        type: input.type,
        targetValue: input.targetValue,
        isActive: true,
        participantsCount: 0,
      });
      return { success: true };
    }),
});

// ── Helper: extract @mentions from text and send notifications ────────────────
export async function processMentions({
  content, actorId, postId, commentId,
}: { content: string; actorId: number; postId: number; commentId?: number }) {
  const db = await getDb();
  if (!db) return;
  // Extract all @name tokens (supports Arabic Unicode names)
  const mentionRegex = /@([\w\u0600-\u06FF]+)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = mentionRegex.exec(content)) !== null) {
    tokens.push(m[1]);
  }
  if (tokens.length === 0) return;
  // Look up actor name once
  const actorRows = await db.select({ name: users.name }).from(users).where(eq(users.id, actorId)).limit(1);
  const actorName = actorRows[0]?.name ?? "Someone";
  for (const token of tokens) {
    // Exact match first, then prefix
    const matched = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.name, token))
      .limit(1);
    const mentionedUser = matched[0];
    if (!mentionedUser || mentionedUser.id === actorId) continue;
    // Save mention record (ignore duplicate)
    try {
      await db.insert(postMentions).values({
        mentionedId: mentionedUser.id,
        actorId,
        postId,
        commentId: commentId ?? null,
      });
    } catch { /* ignore duplicate */ }
    // Send in-app notification
    try {
      await createSocialNotification({
        userId: mentionedUser.id,
        actorId,
        type: "mention",
        postId,
        message: `🔔 ${actorName} ذكرك في ${commentId ? "تعليق" : "منشور"}`,
        messageEn: `🔔 ${actorName} mentioned you in a ${commentId ? "comment" : "post"}`,
      });
      // Real-time socket
      const io = getIO();
      io?.to(`user:${mentionedUser.id}`).emit("notification", {
        type: "mention",
        message: `🔔 ${actorName} mentioned you`,
        postId,
      });
      // Web push
      const sub = await getPushSubscriptionByUser(mentionedUser.id);
      const settings = await getNotificationSettings(mentionedUser.id);
      if (sub) {
        const lang = settings?.language ?? "ar";
        await sendPushToSubscription(sub.endpoint, sub.p256dh, sub.auth, {
          title: "Prime Fit",
          body: lang === "ar"
            ? `🔔 ${actorName} ذكرك في ${commentId ? "تعليق" : "منشور"}`
            : `🔔 ${actorName} mentioned you in a ${commentId ? "comment" : "post"}`,
          icon: "/icons/icon-192.png",
          url: "/community",
        });
      }
    } catch { /* non-fatal */ }
  }
}

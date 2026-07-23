/**
 * Realtime context — replaces the former socket.io connection with Supabase
 * Realtime. It subscribes to Postgres INSERTs on `social_notifications` (the
 * per-user inbox) and `community_posts` (the live feed) and exposes the same
 * API the app already consumed (`useSocket`, unread count, latest notification)
 * plus `latestPost`. All data still flows through tRPC; Realtime only signals
 * "something changed" so the UI can update live.
 *
 * `realtimeConnected` lets consumers fall back to polling automatically when
 * Realtime is unavailable (no server, blocked network, table not published).
 *
 * The file/exports keep their original names so consumers need minimal changes,
 * and the design works identically for web and future React Native clients
 * (both use @supabase/supabase-js).
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabaseClient } from "../lib/supabase";

export interface LiveNotification {
  type: string;
  message: string;
  postId?: number;
  timestamp: number;
}

interface SocketContextValue {
  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;
  latestNotification: LiveNotification | null;
  latestPost: unknown | null;
  realtimeConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  unreadCount: 0,
  incrementUnread: () => {},
  clearUnread: () => {},
  latestNotification: null,
  latestPost: null,
  realtimeConnected: false,
});

export function SocketProvider({ userId, children }: { userId?: number; children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<LiveNotification | null>(null);
  const [latestPost, setLatestPost] = useState<unknown | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !userId) {
      setRealtimeConnected(false);
      return;
    }

    const channel = supabase
      .channel(`app:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_notifications", filter: `userId=eq.${userId}` },
        (payload) => {
          const row = payload.new as { type?: string; message?: string; postId?: number | null };
          setUnreadCount((c) => c + 1);
          setLatestNotification({
            type: row.type ?? "notification",
            message: row.message ?? "New notification",
            postId: row.postId ?? undefined,
            timestamp: Date.now(),
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          setLatestPost(payload.new);
        },
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider
      value={{
        unreadCount,
        incrementUnread: () => setUnreadCount((c) => c + 1),
        clearUnread: () => setUnreadCount(0),
        latestNotification,
        latestPost,
        realtimeConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

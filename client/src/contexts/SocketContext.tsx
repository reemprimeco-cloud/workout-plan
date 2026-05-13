/**
 * SocketContext — manages the socket.io connection for real-time updates.
 * Provides the socket instance and a live notification count to the whole app.
 */
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;
  latestNotification: LiveNotification | null;
}

export interface LiveNotification {
  type: string;
  message: string;
  postId?: number;
  timestamp: number;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  unreadCount: 0,
  incrementUnread: () => {},
  clearUnread: () => {},
  latestNotification: null,
});

export function SocketProvider({ userId, children }: { userId?: number; children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<LiveNotification | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (userId) socket.emit("join", userId);
    });

    // Incoming social notification (like, comment, etc.)
    socket.on("notification", (data: Omit<LiveNotification, "timestamp">) => {
      setUnreadCount(c => c + 1);
      setLatestNotification({ ...data, timestamp: Date.now() });
    });

    return () => { socket.disconnect(); };
  }, [userId]);

  // Re-join room if userId changes (e.g. after login)
  useEffect(() => {
    if (userId && socketRef.current?.connected) {
      socketRef.current.emit("join", userId);
    }
  }, [userId]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      unreadCount,
      incrementUnread: () => setUnreadCount(c => c + 1),
      clearUnread: () => setUnreadCount(0),
      latestNotification,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

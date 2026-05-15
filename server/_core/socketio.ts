/**
 * Socket.IO singleton — import this anywhere to emit events.
 * Separated from index.ts to prevent circular imports.
 */
import type { Server as SocketIOServer } from "socket.io";

let _io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null { return _io; }
export function setIO(io: SocketIOServer): void  { _io = io; }

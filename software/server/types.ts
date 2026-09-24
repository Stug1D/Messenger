import type { Message, Room, User } from "../src/types";

export type MessageType = "message" | "room" | "room-deleted" | "message-deleted" | "message-edited" | "message-reacted";

export type IncomingPayload = {
  type: MessageType;
  chatId?: string;
  room?: Room;
  message?: Message;
  roomId?: string;
  messageId?: string;
  authorId?: string;
  text?: string;
  reactions?: Record<string, string[]>;
};

export type ClientData = {
  id: string;
  userId?: string;
  user?: User;
};
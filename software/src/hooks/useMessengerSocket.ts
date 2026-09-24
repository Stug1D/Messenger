import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { PendingMessage, PendingMessageAction } from "../storage";
import type { Message, Room, User } from "../types";

type IncomingEvent = { type: "presence" | "message" | "room" | "room-deleted" | "message-deleted" | "message-edited" | "message-reacted"; user?: User; userId?: string; online?: boolean; chatId?: string; room?: Room; message?: Message; roomId?: string; messageId?: string; text?: string; reactions?: Record<string, string[]> };

type UseMessengerSocketOptions = {
  currentUser: User | null;
  activeChatId: string | null;
  setSocketState: (state: "offline" | "connected") => void;
  setOnlineUsers: (update: (users: User[]) => User[]) => void;
  setChats: (update: (chats: Room[]) => Room[]) => void;
  setActiveChatId: (id: string | null) => void;
  setPendingMessages: (messages: PendingMessage[]) => void;
  setPendingRooms: (rooms: Room[]) => void;
  setPendingRoomDeletions: (roomIds: string[]) => void;
  setPendingMessageActions: (actions: PendingMessageAction[]) => void;
  socketRef: MutableRefObject<WebSocket | null>;
  pendingMessagesRef: MutableRefObject<PendingMessage[]>;
  pendingRoomsRef: MutableRefObject<Room[]>;
  pendingRoomDeletionsRef: MutableRefObject<string[]>;
  pendingMessageActionsRef: MutableRefObject<PendingMessageAction[]>;
};

// Verwaltet WebSocket-Verbindung, Reconnect, Presence und Serverereignisse.
export function useMessengerSocket({ currentUser, activeChatId, setSocketState, setOnlineUsers, setChats, setActiveChatId, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef }: UseMessengerSocketOptions) {
  useEffect(() => {
    if (!currentUser) return;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      const socket = new WebSocket("ws://localhost:3001");
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        setSocketState("connected");
        socket.send(JSON.stringify({ type: "presence", user: currentUser }));
        pendingRoomsRef.current.forEach((room) => socket.send(JSON.stringify({ type: "room", room })));
        pendingMessagesRef.current.forEach((pendingMessage) => socket.send(JSON.stringify({ type: "message", ...pendingMessage })));
        pendingRoomDeletionsRef.current.forEach((roomId) => socket.send(JSON.stringify({ type: "room-deleted", roomId })));
        pendingMessageActionsRef.current.forEach((action) => socket.send(JSON.stringify(action)));
      });
      socket.addEventListener("close", () => { setSocketState("offline"); if (!stopped) reconnectTimer = setTimeout(connect, 1000); });
      socket.addEventListener("error", () => { setSocketState("offline"); socket.close(); });
      socket.addEventListener("message", (event) => {
        const incoming = JSON.parse(event.data) as IncomingEvent;
        if (incoming.type === "presence") {
          if (incoming.online && incoming.user) setOnlineUsers((users) => users.some((user) => user.id === incoming.user!.id) ? users : [...users, incoming.user!]);
          else if (!incoming.online && incoming.userId) setOnlineUsers((users) => users.filter((user) => user.id !== incoming.userId));
          return;
        }
        if (incoming.type === "room-deleted" && incoming.roomId) {
          setChats((chats) => chats.filter((room) => room.id !== incoming.roomId));
          pendingRoomsRef.current = pendingRoomsRef.current.filter((room) => room.id !== incoming.roomId);
          pendingMessagesRef.current = pendingMessagesRef.current.filter((pending) => pending.chatId !== incoming.roomId);
          pendingRoomDeletionsRef.current = pendingRoomDeletionsRef.current.filter((roomId) => roomId !== incoming.roomId);
          setPendingRooms(pendingRoomsRef.current); setPendingMessages(pendingMessagesRef.current); setPendingRoomDeletions(pendingRoomDeletionsRef.current);
          if (activeChatId === incoming.roomId) setActiveChatId(null);
          return;
        }
        if (incoming.type === "room" && incoming.room) {
          setChats((chats) => chats.some((room) => room.id === incoming.room?.id) ? chats : [...chats, incoming.room!]);
          pendingRoomsRef.current = pendingRoomsRef.current.filter((room) => room.id !== incoming.room?.id);
          setPendingRooms(pendingRoomsRef.current);
          return;
        }
        if (incoming.type === "message" && incoming.chatId && incoming.message) {
          setChats((chats) => chats.map((chat) => chat.id !== incoming.chatId || chat.messages.some((message) => message.id === incoming.message?.id) ? chat : { ...chat, messages: [...chat.messages, incoming.message!], preview: incoming.message!.image ? "Bild" : incoming.message!.text, time: incoming.message!.time }));
          pendingMessagesRef.current = pendingMessagesRef.current.filter((pending) => pending.message.id !== incoming.message?.id);
          setPendingMessages(pendingMessagesRef.current);
        }
        if ((incoming.type === "message-deleted" || incoming.type === "message-edited" || incoming.type === "message-reacted") && incoming.messageId) {
          setChats((chats) => chats.map((chat) => ({ ...chat, preview: incoming.type === "message-deleted" && chat.id === incoming.chatId ? "Diese Nachricht wurde gelöscht" : chat.preview, messages: chat.messages.map((message) => message.id !== incoming.messageId ? message : incoming.type === "message-deleted" ? { ...message, text: "Diese Nachricht wurde gelöscht", deleted: true, edited: false } : incoming.type === "message-edited" ? { ...message, text: incoming.text ?? message.text, edited: true } : { ...message, reactions: incoming.reactions ?? {} }) })));
          pendingMessageActionsRef.current = pendingMessageActionsRef.current.filter((action) => action.messageId !== incoming.messageId);
          setPendingMessageActions(pendingMessageActionsRef.current);
        }
      });
    }

    connect();
    return () => { stopped = true; if (reconnectTimer) clearTimeout(reconnectTimer); const activeSocket = socketRef.current; socketRef.current = null; activeSocket?.close(); };
  }, [currentUser]);
}

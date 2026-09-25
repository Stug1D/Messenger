import type { Message, Room, User } from "./types";

const STORAGE_KEY = "messenger-app-state";

function getStorageKey(userId?: string | null) {
  return `${STORAGE_KEY}:${userId ?? "anonymous"}`;
}

export type PendingMessage = {
  chatId: string;
  message: Message;
};

export type PendingMessageAction = {
  type: "message-deleted" | "message-edited" | "message-reacted";
  chatId: string;
  messageId: string;
  authorId: string;
  text?: string;
  reactions?: Record<string, string[]>;
  emoji?: string;
};

export type StoredAppState = {
  currentUser: User | null;
  rooms: Room[];
  pendingMessages: PendingMessage[];
  pendingRooms: Room[];
  pendingRoomDeletions: string[];
  pendingMessageActions: PendingMessageAction[];
};

export function loadAppState(defaultRooms: Room[], userId?: string | null): StoredAppState {
  // Lädt den letzten Zustand und stellt den geschützten globalen Raum wieder her.
  if (typeof window === "undefined") {
    return { currentUser: null, rooms: defaultRooms, pendingMessages: [], pendingRooms: [], pendingRoomDeletions: [], pendingMessageActions: [] };
  }

  try {
    const storedState = window.localStorage.getItem(getStorageKey(userId));
    if (!storedState) {
      return { currentUser: null, rooms: defaultRooms, pendingMessages: [], pendingRooms: [], pendingRoomDeletions: [], pendingMessageActions: [] };
    }

    const parsedState = JSON.parse(storedState) as Partial<StoredAppState>;
    const storedRooms = parsedState.rooms?.filter((room) => room.id !== "global") ?? [];
    const globalRoom = defaultRooms.find((room) => room.id === "global");
    return {
      currentUser: parsedState.currentUser ?? null,
      rooms: globalRoom ? [globalRoom, ...storedRooms] : storedRooms,
      pendingMessages: parsedState.pendingMessages ?? [],
      pendingRooms: parsedState.pendingRooms ?? [],
      pendingRoomDeletions: (parsedState.pendingRoomDeletions ?? []).filter((roomId) => roomId !== "global"),
      pendingMessageActions: parsedState.pendingMessageActions ?? [],
    };
  } catch {
    return { currentUser: null, rooms: defaultRooms, pendingMessages: [], pendingRooms: [], pendingRoomDeletions: [], pendingMessageActions: [] };
  }
}

export function saveAppState(state: StoredAppState) {
  // Schreibt den kompletten Offline-Zustand als einen konsistenten Snapshot.
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(state.currentUser?.id), JSON.stringify(state));
}
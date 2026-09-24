import type { FormEvent, MutableRefObject } from "react";

import { now } from "../data";
import { saveAppState, type PendingMessage, type PendingMessageAction } from "../storage";
import type { ImageAttachment, Message, ReplyReference, Room, User } from "../types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type UseChatActionsOptions = {
  currentUser: User | null;
  nameInput: string;
  chats: Room[];
  activeChat: Room | undefined;
  messageInput: string;
  editingText: string;
  selectedImage: File | null;
  replyingTo: ReplyReference | null;
  roomNameInput: string;
  participantInput: string;
  setCurrentUser: (user: User | null) => void;
  setActiveChatId: (id: string | null) => void;
  setChats: (update: (chats: Room[]) => Room[]) => void;
  setMessageInput: (value: string) => void;
  setEditingMessageId: (id: string | null) => void;
  setEditingText: (value: string) => void;
  setSelectedImage: (file: File | null) => void;
  setImageError: (error: string) => void;
  setReplyingTo: (reply: ReplyReference | null) => void;
  setPendingMessages: (messages: PendingMessage[]) => void;
  setPendingRooms: (rooms: Room[]) => void;
  setPendingRoomDeletions: (roomIds: string[]) => void;
  setPendingMessageActions: (actions: PendingMessageAction[]) => void;
  setRoomNameInput: (value: string) => void;
  setParticipantInput: (value: string) => void;
  setIsCreateRoomOpen: (value: boolean) => void;
  socketRef: MutableRefObject<WebSocket | null>;
  pendingMessagesRef: MutableRefObject<PendingMessage[]>;
  pendingRoomsRef: MutableRefObject<Room[]>;
  pendingRoomDeletionsRef: MutableRefObject<string[]>;
  pendingMessageActionsRef: MutableRefObject<PendingMessageAction[]>;
};

function readImageFile(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve({ name: file.name, type: file.type, data: reader.result });
      else reject(new Error("Bild konnte nicht gelesen werden."));
    });
    reader.addEventListener("error", () => reject(new Error("Bild konnte nicht gelesen werden.")));
    reader.readAsDataURL(file);
  });
}

// Bündelt alle Benutzeraktionen, die Räume oder Nachrichten verändern.
export function useChatActions({ currentUser, nameInput, chats, activeChat, messageInput, editingText, selectedImage, replyingTo, roomNameInput, participantInput, setCurrentUser, setActiveChatId, setChats, setMessageInput, setEditingMessageId, setEditingText, setSelectedImage, setImageError, setReplyingTo, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, setRoomNameInput, setParticipantInput, setIsCreateRoomOpen, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef }: UseChatActionsOptions) {
  function login(event: FormEvent) {
    event.preventDefault();
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;
    const newUser: User = { id: crypto.randomUUID(), name: trimmedName, initials: trimmedName.slice(0, 2).toUpperCase(), accent: "coral" };
    setCurrentUser(newUser);
    setChats((rooms) => rooms.map((room) => room.id === "global" && !room.participants.some((participant) => participant.id === newUser.id) ? { ...room, participants: [...room.participants, newUser] } : room));
  }

  function logout() {
    setCurrentUser(null);
    setActiveChatId(null);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = messageInput.trim();
    if ((!text && !selectedImage) || !activeChat || !currentUser) return;

    let image: ImageAttachment | undefined;
    if (selectedImage) {
      try { image = await readImageFile(selectedImage); }
      catch (error) { setImageError(error instanceof Error ? error.message : "Bild konnte nicht gelesen werden."); return; }
    }

    const message: Message = { id: crypto.randomUUID(), author: currentUser, text, time: now(), image, replyTo: replyingTo ?? undefined };
    setMessageInput("");
    setSelectedImage(null);
    setImageError("");
    setReplyingTo(null);
    const nextChats = chats.map((chat) => chat.id === activeChat.id ? { ...chat, messages: [...chat.messages, message], preview: image ? "Bild" : text, time: message.time } : chat);
    const nextPendingMessages = [...pendingMessagesRef.current, { chatId: activeChat.id, message }];
    pendingMessagesRef.current = nextPendingMessages;
    setChats(() => nextChats);
    setPendingMessages(nextPendingMessages);
    saveAppState({ currentUser, rooms: nextChats, pendingMessages: nextPendingMessages, pendingRooms: pendingRoomsRef.current, pendingRoomDeletions: pendingRoomDeletionsRef.current, pendingMessageActions: pendingMessageActionsRef.current });
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "message", chatId: activeChat.id, message, room: activeChat }));
  }

  function selectImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImageError("Bitte wähle eine Bilddatei aus."); setSelectedImage(null); return; }
    if (file.size > MAX_IMAGE_SIZE) { setImageError("Das Bild ist zu groß. Maximal erlaubt sind 5 MB."); setSelectedImage(null); return; }
    setImageError("");
    setSelectedImage(file);
  }

  function removeSelectedImage() {
    setSelectedImage(null);
    setImageError("");
  }

  function createRoom(event: FormEvent) {
    event.preventDefault();
    if (!currentUser) return;
    const roomName = roomNameInput.trim();
    const participantNames = participantInput.split(/[\n,]/).map((name) => name.trim()).filter(Boolean);
    if (!roomName || participantNames.length === 0) return;
    const participants = [currentUser, ...participantNames.filter((name, index) => participantNames.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index).map((name, index) => ({ id: crypto.randomUUID(), name, initials: name.slice(0, 2).toUpperCase(), accent: ["coral", "gold", "mint"][index % 3] ?? "coral" }))];
    const newRoom: Room = { id: crypto.randomUUID(), name: roomName, initials: roomName.slice(0, 2).toUpperCase(), accent: "gold", preview: "Noch keine Nachrichten", time: "", participants, messages: [] };
    setChats((rooms) => [...rooms, newRoom]);
    const nextPendingRooms = [...pendingRoomsRef.current, newRoom];
    pendingRoomsRef.current = nextPendingRooms;
    setPendingRooms(nextPendingRooms);
    saveAppState({ currentUser, rooms: [...chats, newRoom], pendingMessages: pendingMessagesRef.current, pendingRooms: nextPendingRooms, pendingRoomDeletions: pendingRoomDeletionsRef.current, pendingMessageActions: pendingMessageActionsRef.current });
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "room", room: newRoom }));
    setRoomNameInput(""); setParticipantInput(""); setIsCreateRoomOpen(false); setActiveChatId(newRoom.id);
  }

  function updateMessage(messageId: string, updater: (message: Message) => Message, chatId?: string, preview?: string) {
    setChats((rooms) => rooms.map((chat) => ({ ...chat, preview: chat.id === chatId && preview ? preview : chat.preview, messages: chat.messages.map((message) => message.id === messageId ? updater(message) : message) })));
  }

  function saveAction(action: PendingMessageAction) {
    const nextActions = [...pendingMessageActionsRef.current.filter((pendingAction) => pendingAction.messageId !== action.messageId), action];
    pendingMessageActionsRef.current = nextActions;
    setPendingMessageActions(nextActions);
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(action));
  }

  function deleteMessage(message: Message) {
    if (!currentUser || message.author.id !== currentUser.id || message.deleted) return;
    updateMessage(message.id, (currentMessage) => ({ ...currentMessage, text: "Diese Nachricht wurde gelöscht", deleted: true, edited: false }), activeChat?.id, "Diese Nachricht wurde gelöscht");
    saveAction({ type: "message-deleted", chatId: activeChat?.id ?? "", messageId: message.id, authorId: currentUser.id });
  }

  function editMessage(message: Message) {
    if (!currentUser || message.author.id !== currentUser.id || message.deleted) return;
    const nextText = editingText.trim();
    if (!nextText) return;
    updateMessage(message.id, (currentMessage) => ({ ...currentMessage, text: nextText, edited: true }));
    saveAction({ type: "message-edited", chatId: activeChat?.id ?? "", messageId: message.id, authorId: currentUser.id, text: nextText });
    setEditingMessageId(null); setEditingText("");
  }

  function toggleReaction(message: Message, emoji: string) {
    if (!currentUser || message.deleted) return;
    const reactions = Object.fromEntries(Object.entries(message.reactions ?? {}).map(([reaction, userIds]) => [reaction, [...userIds]]));
    const userIds = reactions[emoji] ?? [];
    reactions[emoji] = userIds.includes(currentUser.id) ? userIds.filter((userId) => userId !== currentUser.id) : [...userIds, currentUser.id];
    if (reactions[emoji].length === 0) delete reactions[emoji];
    updateMessage(message.id, (currentMessage) => ({ ...currentMessage, reactions }));
    saveAction({ type: "message-reacted", chatId: activeChat?.id ?? "", messageId: message.id, authorId: currentUser.id, reactions });
  }

  function replyToMessage(message: Message) {
    setReplyingTo({ messageId: message.id, authorName: message.author.name, text: message.text, imageName: message.image?.name });
  }

  function deleteRoom() {
    if (!activeChat || activeChat.id === "global") return;
    const deletedRoomId = activeChat.id;
    const nextChats = chats.filter((room) => room.id !== deletedRoomId);
    const nextPendingRooms = pendingRoomsRef.current.filter((room) => room.id !== deletedRoomId);
    const nextPendingMessages = pendingMessagesRef.current.filter((pending) => pending.chatId !== deletedRoomId);
    const nextPendingRoomDeletions = pendingRoomDeletionsRef.current.includes(deletedRoomId) ? pendingRoomDeletionsRef.current : [...pendingRoomDeletionsRef.current, deletedRoomId];
    pendingRoomsRef.current = nextPendingRooms; pendingMessagesRef.current = nextPendingMessages; pendingRoomDeletionsRef.current = nextPendingRoomDeletions;
    setChats(() => nextChats); setPendingRooms(nextPendingRooms); setPendingMessages(nextPendingMessages); setPendingRoomDeletions(nextPendingRoomDeletions); setActiveChatId(null);
    saveAppState({ currentUser, rooms: nextChats, pendingMessages: nextPendingMessages, pendingRooms: nextPendingRooms, pendingRoomDeletions: nextPendingRoomDeletions, pendingMessageActions: pendingMessageActionsRef.current });
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: "room-deleted", roomId: deletedRoomId }));
  }

  return { login, logout, sendMessage, selectImage, removeSelectedImage, createRoom, deleteMessage, editMessage, toggleReaction, replyToMessage, deleteRoom };
}

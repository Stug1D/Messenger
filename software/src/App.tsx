import { useEffect, useMemo, useRef, useState } from "react";

import { ChatListScreen } from "./components/ChatListScreen";
import { ConversationScreen } from "./components/ConversationScreen";
import { LoginScreen } from "./components/LoginScreen";
import { starterChats } from "./data";
import { getAuthToken, getSession, getStoredAuthUser, signIn, signOut, signUp } from "./auth-client";
import { useChatActions } from "./hooks/useChatActions";
import { useMessengerSocket } from "./hooks/useMessengerSocket";
import { loadAppState, saveAppState, type PendingMessage, type PendingMessageAction } from "./storage";
import type { Room, User } from "./types";

function App() {
  const [initialState] = useState(() => loadAppState(starterChats));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadedAccountId, setLoadedAccountId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Room[]>(starterChats);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [pendingRooms, setPendingRooms] = useState<Room[]>([]);
  const [pendingRoomDeletions, setPendingRoomDeletions] = useState<string[]>([]);
  const [pendingMessageActions, setPendingMessageActions] = useState<PendingMessageAction[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<import("./types").ReplyReference | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [socketState, setSocketState] = useState<"offline" | "connected">("offline");
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<PendingMessage[]>([]);
  const pendingRoomsRef = useRef<Room[]>([]);
  const pendingRoomDeletionsRef = useRef<string[]>([]);
  const pendingMessageActionsRef = useRef<PendingMessageAction[]>([]);
  const activeChat = chats.find((chat) => chat.id === activeChatId);

  function setActiveChat(id: string | null) {
    setActiveChatId(id);
    if (!currentUser) return;
    const storageKey = `messenger-active-chat:${currentUser.id}`;
    if (id) sessionStorage.setItem(storageKey, id);
    else sessionStorage.removeItem(storageKey);
  }

  // Speichert den vollständigen lokalen Zustand nach jeder relevanten Änderung.
  useEffect(() => {
    if (!authReady || !currentUser || loadedAccountId !== currentUser.id) return;
    saveAppState({ currentUser, rooms: chats, pendingMessages, pendingRooms, pendingRoomDeletions, pendingMessageActions });
  }, [authReady, loadedAccountId, currentUser, chats, pendingMessages, pendingRooms, pendingRoomDeletions, pendingMessageActions]);

  // Lädt nach dem Login nur den lokalen Zustand dieses Accounts.
  useEffect(() => {
    if (!currentUser) {
      setLoadedAccountId(null);
      return;
    }
    const accountState = loadAppState(starterChats, currentUser.id);
    setChats(accountState.rooms);
    setPendingMessages(accountState.pendingMessages);
    setPendingRooms(accountState.pendingRooms);
    setPendingRoomDeletions(accountState.pendingRoomDeletions);
    setPendingMessageActions(accountState.pendingMessageActions);
    pendingMessagesRef.current = accountState.pendingMessages;
    pendingRoomsRef.current = accountState.pendingRooms;
    pendingRoomDeletionsRef.current = accountState.pendingRoomDeletions;
    pendingMessageActionsRef.current = accountState.pendingMessageActions;
    setLoadedAccountId(currentUser.id);
  }, [currentUser]);

  // Lädt die serverseitige Session und nutzt lokale Identität nur als Offline-Fallback.
  useEffect(() => {
    if (!getAuthToken()) {
      setCurrentUser(null);
      setAuthReady(true);
      return;
    }
    getSession().then((data) => {
      if (data.user) setCurrentUser({ id: data.user.id, name: data.user.name, initials: data.user.name.slice(0, 2).toUpperCase(), accent: "coral" });
      else setCurrentUser(null);
    }).catch(() => {
      const storedUser = getStoredAuthUser();
      setCurrentUser(storedUser ? { id: storedUser.id, name: storedUser.name, initials: storedUser.name.slice(0, 2).toUpperCase(), accent: "coral" } : null);
    }).finally(() => setAuthReady(true));
  }, []);

  // Der globale Raum bleibt unabhängig von alten oder beschädigten Local-Storage-Daten erhalten.
  useEffect(() => {
    if (!currentUser) return;
    setChats((rooms) => {
      const globalRoom = rooms.find((room) => room.id === "global");
      if (globalRoom) return rooms.map((room) => room.id === "global" && !room.participants.some((participant) => participant.id === currentUser.id) ? { ...room, participants: [...room.participants, currentUser] } : room);
      return [{ ...starterChats[0]!, participants: [currentUser] }, ...rooms];
    });
  }, [currentUser]);

  // Stellt nach einem Reload den zuletzt geöffneten Raum dieses Tabs wieder her.
  useEffect(() => {
    if (!currentUser || loadedAccountId !== currentUser.id || activeChatId) return;
    const storedChatId = sessionStorage.getItem(`messenger-active-chat:${currentUser.id}`);
    if (storedChatId && chats.some((chat) => chat.id === storedChatId)) setActiveChatId(storedChatId);
  }, [currentUser, loadedAccountId, chats, activeChatId]);

  useMessengerSocket({ currentUser, globalRoom: chats.find((room) => room.id === "global"), activeChatId, setSocketState, setOnlineUsers, setChats, setActiveChatId: setActiveChat, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef });

  const currentMessages = useMemo(() => activeChat?.messages ?? [], [activeChat]);
  const knownParticipants = activeChat ? [...activeChat.participants, ...activeChat.messages.map((message) => message.author)] : [];
  const uniqueParticipants = knownParticipants.filter((participant, index, participants) => participants.findIndex((candidate) => candidate.id === participant.id || candidate.name.toLowerCase() === participant.name.toLowerCase()) === index);
  const onlineParticipants = uniqueParticipants.filter((participant) => participant.id !== currentUser?.id && participant.name.toLowerCase() !== currentUser?.name.toLowerCase() && onlineUsers.some((user) => user.id === participant.id || user.name.toLowerCase() === participant.name.toLowerCase()));

  const chatActions = useChatActions({ currentUser, nameInput, chats, activeChat, messageInput, editingText, selectedImage, replyingTo, roomNameInput, participantInput, setCurrentUser, setActiveChatId: setActiveChat, setChats, setMessageInput, setEditingMessageId, setEditingText, setSelectedImage, setImageError, setReplyingTo, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, setRoomNameInput, setParticipantInput, setIsCreateRoomOpen, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef });

  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    try {
      const result = authMode === "sign-up" ? await signUp(emailInput, passwordInput, nameInput.trim()) : await signIn(emailInput, passwordInput);
      if (!result.user) throw new Error("Der Server hat keinen User zurückgegeben.");
      setCurrentUser({ id: result.user.id, name: result.user.name, initials: result.user.name.slice(0, 2).toUpperCase(), accent: "coral" });
      setPasswordInput("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentifizierung fehlgeschlagen.");
    }
  }

  async function logout() {
    await signOut().catch(() => undefined);
    chatActions.logout();
    setActiveChat(null);
  }

  if (!authReady) return <main className="auth-loading"><p>Loading session...</p></main>;
  if (!currentUser) return <LoginScreen authMode={authMode} emailInput={emailInput} passwordInput={passwordInput} nameInput={nameInput} authError={authError} setAuthMode={setAuthMode} setEmailInput={setEmailInput} setPasswordInput={setPasswordInput} setNameInput={setNameInput} onSubmit={authenticate} />;

  if (!activeChat) return <ChatListScreen currentUser={currentUser} chats={chats} isCreateRoomOpen={isCreateRoomOpen} roomNameInput={roomNameInput} participantInput={participantInput} setRoomNameInput={setRoomNameInput} setParticipantInput={setParticipantInput} setIsCreateRoomOpen={setIsCreateRoomOpen} setActiveChatId={setActiveChat} onCreateRoom={chatActions.createRoom} onLogout={logout} />;

  return <ConversationScreen activeChat={activeChat} currentUser={currentUser} socketState={socketState} onlineParticipants={onlineParticipants} currentMessages={currentMessages} editingMessageId={editingMessageId} editingText={editingText} reactionMessageId={reactionMessageId} replyingTo={replyingTo} setActiveChatId={setActiveChat} setEditingMessageId={setEditingMessageId} setEditingText={setEditingText} setReactionMessageId={setReactionMessageId} setReplyingTo={setReplyingTo} onDeleteRoom={chatActions.deleteRoom} onEditMessage={chatActions.editMessage} onDeleteMessage={chatActions.deleteMessage} onToggleReaction={chatActions.toggleReaction} onReplyToMessage={chatActions.replyToMessage} onSendMessage={chatActions.sendMessage} messageInput={messageInput} setMessageInput={setMessageInput} selectedImage={selectedImage} imageError={imageError} onSelectImage={chatActions.selectImage} onRemoveImage={chatActions.removeSelectedImage} />;
}

export default App;

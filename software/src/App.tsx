import { useEffect, useMemo, useRef, useState } from "react";

import { ChatListScreen } from "./components/ChatListScreen";
import { ConversationScreen } from "./components/ConversationScreen";
import { LoginScreen } from "./components/LoginScreen";
import { starterChats } from "./data";
import { useChatActions } from "./hooks/useChatActions";
import { useMessengerSocket } from "./hooks/useMessengerSocket";
import { loadAppState, saveAppState, type PendingMessage, type PendingMessageAction } from "./storage";
import type { Room, User } from "./types";

function App() {
  const [initialState] = useState(() => loadAppState(starterChats));
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.currentUser);
  const [nameInput, setNameInput] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Room[]>(initialState.rooms);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>(initialState.pendingMessages);
  const [pendingRooms, setPendingRooms] = useState<Room[]>(initialState.pendingRooms);
  const [pendingRoomDeletions, setPendingRoomDeletions] = useState<string[]>(initialState.pendingRoomDeletions);
  const [pendingMessageActions, setPendingMessageActions] = useState<PendingMessageAction[]>(initialState.pendingMessageActions);
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
  const pendingMessagesRef = useRef(initialState.pendingMessages);
  const pendingRoomsRef = useRef(initialState.pendingRooms);
  const pendingRoomDeletionsRef = useRef(initialState.pendingRoomDeletions);
  const pendingMessageActionsRef = useRef(initialState.pendingMessageActions);
  const activeChat = chats.find((chat) => chat.id === activeChatId);

  // Speichert den vollständigen lokalen Zustand nach jeder relevanten Änderung.
  useEffect(() => {
    saveAppState({ currentUser, rooms: chats, pendingMessages, pendingRooms, pendingRoomDeletions, pendingMessageActions });
  }, [currentUser, chats, pendingMessages, pendingRooms, pendingRoomDeletions, pendingMessageActions]);

  // Der globale Raum bleibt unabhängig von alten oder beschädigten Local-Storage-Daten erhalten.
  useEffect(() => {
    if (!currentUser) return;
    setChats((rooms) => {
      const globalRoom = rooms.find((room) => room.id === "global");
      if (globalRoom) return rooms.map((room) => room.id === "global" && !room.participants.some((participant) => participant.id === currentUser.id) ? { ...room, participants: [...room.participants, currentUser] } : room);
      return [{ ...starterChats[0]!, participants: [currentUser] }, ...rooms];
    });
  }, [currentUser]);

  useMessengerSocket({ currentUser, activeChatId, setSocketState, setOnlineUsers, setChats, setActiveChatId, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef });

  const currentMessages = useMemo(() => activeChat?.messages ?? [], [activeChat]);
  const knownParticipants = activeChat ? [...activeChat.participants, ...activeChat.messages.map((message) => message.author)] : [];
  const uniqueParticipants = knownParticipants.filter((participant, index, participants) => participants.findIndex((candidate) => candidate.id === participant.id || candidate.name.toLowerCase() === participant.name.toLowerCase()) === index);
  const onlineParticipants = uniqueParticipants.filter((participant) => participant.id !== currentUser?.id && participant.name.toLowerCase() !== currentUser?.name.toLowerCase() && onlineUsers.some((user) => user.id === participant.id || user.name.toLowerCase() === participant.name.toLowerCase()));

  const chatActions = useChatActions({ currentUser, nameInput, chats, activeChat, messageInput, editingText, selectedImage, replyingTo, roomNameInput, participantInput, setCurrentUser, setActiveChatId, setChats, setMessageInput, setEditingMessageId, setEditingText, setSelectedImage, setImageError, setReplyingTo, setPendingMessages, setPendingRooms, setPendingRoomDeletions, setPendingMessageActions, setRoomNameInput, setParticipantInput, setIsCreateRoomOpen, socketRef, pendingMessagesRef, pendingRoomsRef, pendingRoomDeletionsRef, pendingMessageActionsRef });

  if (!currentUser) return <LoginScreen nameInput={nameInput} setNameInput={setNameInput} onSubmit={chatActions.login} />;

  if (!activeChat) return <ChatListScreen currentUser={currentUser} chats={chats} isCreateRoomOpen={isCreateRoomOpen} roomNameInput={roomNameInput} participantInput={participantInput} setRoomNameInput={setRoomNameInput} setParticipantInput={setParticipantInput} setIsCreateRoomOpen={setIsCreateRoomOpen} setActiveChatId={setActiveChatId} onCreateRoom={chatActions.createRoom} onLogout={chatActions.logout} />;

  return <ConversationScreen activeChat={activeChat} currentUser={currentUser} socketState={socketState} onlineParticipants={onlineParticipants} currentMessages={currentMessages} editingMessageId={editingMessageId} editingText={editingText} reactionMessageId={reactionMessageId} replyingTo={replyingTo} setActiveChatId={setActiveChatId} setEditingMessageId={setEditingMessageId} setEditingText={setEditingText} setReactionMessageId={setReactionMessageId} setReplyingTo={setReplyingTo} onDeleteRoom={chatActions.deleteRoom} onEditMessage={chatActions.editMessage} onDeleteMessage={chatActions.deleteMessage} onToggleReaction={chatActions.toggleReaction} onReplyToMessage={chatActions.replyToMessage} onSendMessage={chatActions.sendMessage} messageInput={messageInput} setMessageInput={setMessageInput} selectedImage={selectedImage} imageError={imageError} onSelectImage={chatActions.selectImage} onRemoveImage={chatActions.removeSelectedImage} />;
}

export default App;

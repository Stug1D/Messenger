import type { FormEvent } from "react";

import type { Room, User } from "../types";

type ChatListScreenProps = {
  currentUser: User;
  chats: Room[];
  isCreateRoomOpen: boolean;
  roomNameInput: string;
  participantInput: string;
  setRoomNameInput: (value: string) => void;
  setParticipantInput: (value: string) => void;
  setIsCreateRoomOpen: (value: boolean) => void;
  setActiveChatId: (value: string) => void;
  onCreateRoom: (event: FormEvent) => void;
  onLogout: () => void;
};

// Zeigt die Raumübersicht und das Formular zum Erstellen neuer Konversationen.
export function ChatListScreen({ currentUser, chats, isCreateRoomOpen, roomNameInput, participantInput, setRoomNameInput, setParticipantInput, setIsCreateRoomOpen, setActiveChatId, onCreateRoom, onLogout }: ChatListScreenProps) {
  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand-mark small">M</div><span className="topbar-title">Your messages</span><button className="logout-button" onClick={onLogout} type="button">Log out</button><div className="user-pill"><span className="online-dot" />{currentUser.name}</div></header>
      <section className="chat-list-page">
        <div className="page-heading"><div><p className="eyebrow">Good morning, {currentUser.name}</p><h1>All conversations</h1></div><button className="new-button" onClick={() => setIsCreateRoomOpen(true)} aria-label="New conversation">+</button></div>
        <div className="chat-list">{chats.map((chat) => <button className="chat-row" key={chat.id} onClick={() => setActiveChatId(chat.id)}><div className={`avatar ${chat.accent}`}>{chat.initials}</div><div className="chat-row-copy"><strong>{chat.name}</strong><span>{chat.preview}</span></div><time>{chat.time}</time></button>)}</div>
      </section>
      {isCreateRoomOpen && <div className="modal-backdrop" role="presentation" onClick={() => setIsCreateRoomOpen(false)}>
        <section className="create-room-modal" role="dialog" aria-modal="true" aria-labelledby="create-room-title" onClick={(event) => event.stopPropagation()}>
          <div className="modal-heading"><div><p className="eyebrow">Start a conversation</p><h2 id="create-room-title">Create a room</h2></div><button className="modal-close" type="button" onClick={() => setIsCreateRoomOpen(false)} aria-label="Close">×</button></div>
          <form className="create-room-form" onSubmit={onCreateRoom}>
            <label htmlFor="room-name">Room name</label>
            <input id="room-name" value={roomNameInput} onChange={(event) => setRoomNameInput(event.target.value)} placeholder="e.g. Weekend plans" autoFocus />
            <label htmlFor="participants">Participants</label>
            <textarea id="participants" value={participantInput} onChange={(event) => setParticipantInput(event.target.value)} placeholder="Add names, separated by commas" rows={4} />
            <p className="form-hint">You will be added automatically. Add one person for a direct chat or several for a group.</p>
            <button className="create-room-button" type="submit">Create conversation <span>→</span></button>
          </form>
        </section>
      </div>}
    </main>
  );
}
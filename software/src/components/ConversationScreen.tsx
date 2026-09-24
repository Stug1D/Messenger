import type { FormEvent } from "react";

import { reactionEmojis } from "../data";
import type { Message, ReplyReference, Room, User } from "../types";

type ConversationScreenProps = {
  activeChat: Room;
  currentUser: User;
  socketState: "offline" | "connected";
  onlineParticipants: User[];
  currentMessages: Message[];
  editingMessageId: string | null;
  editingText: string;
  reactionMessageId: string | null;
  replyingTo: ReplyReference | null;
  setActiveChatId: (value: string | null) => void;
  setEditingMessageId: (value: string | null) => void;
  setEditingText: (value: string) => void;
  setReactionMessageId: (value: string | null) => void;
  setReplyingTo: (value: ReplyReference | null) => void;
  onDeleteRoom: () => void;
  onEditMessage: (message: Message) => void;
  onDeleteMessage: (message: Message) => void;
  onToggleReaction: (message: Message, emoji: string) => void;
  onReplyToMessage: (message: Message) => void;
  onSendMessage: (event: FormEvent) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
  selectedImage: File | null;
  imageError: string;
  onSelectImage: (file: File | null) => void;
  onRemoveImage: () => void;
};

// Zeigt eine Konversation, Nachrichtenaktionen und Emoji-Reaktionen.
export function ConversationScreen({ activeChat, currentUser, socketState, onlineParticipants, currentMessages, editingMessageId, editingText, reactionMessageId, replyingTo, setActiveChatId, setEditingMessageId, setEditingText, setReactionMessageId, setReplyingTo, onDeleteRoom, onEditMessage, onDeleteMessage, onToggleReaction, onReplyToMessage, onSendMessage, messageInput, setMessageInput, selectedImage, imageError, onSelectImage, onRemoveImage }: ConversationScreenProps) {
  const knownParticipants = [...activeChat.participants, ...currentMessages.map((message) => message.author)];
  const otherParticipants = knownParticipants.filter((participant, index, participants) => participant.id !== currentUser.id && participant.name.toLowerCase() !== currentUser.name.toLowerCase() && participants.findIndex((candidate) => candidate.id === participant.id || candidate.name.toLowerCase() === participant.name.toLowerCase()) === index);
  const isDirectChat = otherParticipants.length === 1;
  const presenceText = isDirectChat
    ? `${otherParticipants[0]?.name ?? "Gegenüber"} ${onlineParticipants.length === 1 ? "ist online" : "ist offline"}`
    : `${onlineParticipants.length} ${onlineParticipants.length === 1 ? "Person ist" : "Personen sind"} online`;

  return (
    <main className="app-shell">
      <header className="topbar"><button className="back-button" onClick={() => setActiveChatId(null)} aria-label="Back to conversations">←</button><div className={`avatar ${activeChat.accent}`}>{activeChat.initials}</div><div className="topbar-person"><strong>{activeChat.name}</strong><span className="participant-status">{presenceText}</span></div>{activeChat.id !== "global" && <button className="delete-room-button" onClick={onDeleteRoom} type="button">Delete chat</button>}<div className="user-pill"><span className={socketState === "connected" ? "online-dot" : "offline-dot"} /> <span>{currentUser.name}</span><span className="user-status">{socketState === "connected" ? "Online" : "Offline"}</span></div></header>
      <section className="conversation">
        <div className="conversation-intro"><span>Today</span></div>
        <div className="messages">{currentMessages.map((message) => <article className={`message ${message.author.id === currentUser.id ? "mine" : ""}`} key={message.id}><div className="message-meta"><strong>{message.author.name}</strong><time>{message.time}</time></div>{message.replyTo && <div className="reply-quote"><strong>{message.replyTo.authorName}</strong><span>{message.replyTo.text || message.replyTo.imageName || "Bild"}</span></div>}{editingMessageId === message.id ? <form className="edit-message-form" onSubmit={(event) => { event.preventDefault(); onEditMessage(message); }}><input value={editingText} onChange={(event) => setEditingText(event.target.value)} autoFocus /><div><button type="submit">Save</button><button type="button" onClick={() => setEditingMessageId(null)}>Cancel</button></div></form> : <>{message.image && <img className="image-message" src={message.image.data} alt={message.image.name} />}{message.text && <p className={message.deleted ? "deleted-message" : ""}>{message.text}{message.edited && !message.deleted && <small> (edited)</small>}</p>}</>}{!message.deleted && <div className="reaction-tools"><div className="reaction-list">{Object.entries(message.reactions ?? {}).map(([emoji, users]) => <button className={users.includes(currentUser.id) ? "reaction active" : "reaction"} type="button" key={emoji} onClick={() => onToggleReaction(message, emoji)}>{emoji} {users.length}</button>)}</div><button className="reaction-add" type="button" onClick={() => setReactionMessageId(reactionMessageId === message.id ? null : message.id)} aria-label="Add reaction">+</button>{reactionMessageId === message.id && <div className="reaction-picker">{reactionEmojis.map((emoji) => <button type="button" key={emoji} onClick={() => onToggleReaction(message, emoji)}>{emoji}</button>)}</div>}</div>}{!message.deleted && <div className="message-actions"><button type="button" onClick={() => onReplyToMessage(message)}>Reply</button>{message.author.id === currentUser.id && editingMessageId !== message.id && <><button type="button" onClick={() => { setEditingMessageId(message.id); setEditingText(message.text); }}>Edit</button><button type="button" onClick={() => onDeleteMessage(message)}>Delete</button></>}</div>}</article>)}</div>
        <form className="composer" onSubmit={onSendMessage}>{replyingTo && <div className="replying-to"><div><strong>Reply to {replyingTo.authorName}</strong><span>{replyingTo.text || replyingTo.imageName || "Bild"}</span></div><button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button></div>}<div className="composer-attachment">{selectedImage && <div className="selected-file"><span>{selectedImage.name}</span><button type="button" onClick={onRemoveImage} aria-label="Remove selected image">×</button></div>}<label className="attach-button" aria-label="Add image">＋<input type="file" accept="image/*" onChange={(event) => { onSelectImage(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label>{imageError && <p className="image-error">{imageError}</p>}</div><input value={messageInput} onChange={(event) => setMessageInput(event.target.value)} placeholder="Write a message..." aria-label="Message" /><button type="submit" aria-label="Send message">↑</button></form>
      </section>
    </main>
  );
}
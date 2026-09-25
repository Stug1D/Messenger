import type { PendingMessageAction } from "./storage";
import type { Message, ReplyReference } from "./types";

// Erstellt einen stabilen Snapshot für eine Reply, auch wenn sich die Originalnachricht später ändert.
export function createReplyReference(message: Message): ReplyReference | null {
  if (message.deleted) return null;
  return {
    messageId: message.id,
    authorName: message.author.name,
    text: message.text,
    imageName: message.image?.name,
  };
}

// Ersetzt eine ältere Offline-Aktion derselben Nachricht durch die neueste Aktion.
export function upsertPendingMessageAction(actions: PendingMessageAction[], action: PendingMessageAction) {
  return [...actions.filter((pendingAction) => pendingAction.messageId !== action.messageId), action];
}

// Entfernt eine Aktion, sobald der Server sie zurückbroadcastet hat.
export function removePendingMessageAction(actions: PendingMessageAction[], messageId: string) {
  return actions.filter((action) => action.messageId !== messageId);
}

// Erlaubt Bearbeiten und Löschen nur dem Autor einer noch aktiven Nachricht.
export function canMutateMessage(message: Message, userId: string) {
  return !message.deleted && message.author.id === userId;
}

// Fügt eine User-Reaktion hinzu oder entfernt sie wieder, ohne das Originalobjekt zu verändern.
export function toggleUserReaction(reactions: Record<string, string[]>, userId: string, emoji: string) {
  const nextReactions = Object.fromEntries(Object.entries(reactions).map(([reaction, users]) => [reaction, [...users]]));
  const users = nextReactions[emoji] ?? [];
  const nextUsers = users.includes(userId) ? users.filter((id) => id !== userId) : [...users, userId];
  if (nextUsers.length === 0) delete nextReactions[emoji];
  else nextReactions[emoji] = nextUsers;
  return nextReactions;
}
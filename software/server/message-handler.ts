import { database, saveMessage, saveRoom } from "./database";
import type { IncomingPayload } from "./types";

export function handleMessage(rawMessage: string): string | null {
  // Parst eine WebSocket-Anfrage, persistiert sie und gibt sie für den Broadcast zurück.
  let payload: IncomingPayload;

  try {
    payload = JSON.parse(rawMessage) as IncomingPayload;
  } catch {
    return null;
  }

  switch (payload.type) {
    case "room":
      // Räume werden idempotent gespeichert, sodass Reconnects sicher wiederholt werden können.
      if (payload.room) saveRoom(payload.room);
      break;
    case "message":
      // Eine Nachricht kann ihren Raum gleich mitliefern, falls dieser lokal neu erstellt wurde.
      if (payload.chatId && payload.message) {
        if (payload.room) saveRoom(payload.room);
        saveMessage(payload.chatId, payload.message);
      }
      break;
    case "room-deleted":
      // Der globale Systemraum ist geschützt und wird niemals gelöscht.
      if (payload.roomId && payload.roomId !== "global") {
        database.query("DELETE FROM messages WHERE room_id = ?").run(payload.roomId);
        database.query("DELETE FROM rooms WHERE id = ?").run(payload.roomId);
      }
      break;
    case "message-deleted":
      // Löschen ersetzt den Inhalt, damit der Verlauf und die Vorschau erhalten bleiben.
      if (payload.messageId && payload.authorId) {
        database.query("UPDATE messages SET text = ?, deleted = 1, edited = 0 WHERE id = ? AND author_id = ?").run("Diese Nachricht wurde gelöscht", payload.messageId, payload.authorId);
      }
      break;
    case "message-edited":
      // Nur nicht gelöschte Nachrichten dürfen nachträglich geändert werden.
      if (payload.messageId && payload.authorId && payload.text?.trim()) {
        database.query("UPDATE messages SET text = ?, edited = 1 WHERE id = ? AND author_id = ? AND deleted = 0").run(payload.text.trim(), payload.messageId, payload.authorId);
      }
      break;
    case "message-reacted":
      // Die Reaktionsliste wird als JSON-Snapshot gespeichert.
      if (payload.messageId && payload.reactions) {
        database.query("UPDATE messages SET reactions_json = ? WHERE id = ? AND deleted = 0").run(JSON.stringify(payload.reactions), payload.messageId);
      }
      break;
    default:
      return null;
  }

  return JSON.stringify(payload);
}
import { database, getMessageReactions, getMessageRoomId, getRoomParticipants, isRoomMember, roomExists, saveMessage, saveRoom } from "./database";
import type { IncomingPayload } from "./types";
import type { User } from "../src/types";

export function handleMessage(rawMessage: string, actor: User): string | null {
  // Parst eine WebSocket-Anfrage, persistiert sie und gibt sie für den Broadcast zurück.
  let payload: IncomingPayload;

  try {
    payload = JSON.parse(rawMessage) as IncomingPayload;
  } catch {
    return null;
  }

  switch (payload.type) {
    case "room":
      if (payload.room) {
        const existingParticipants = payload.room.id === "global" ? getRoomParticipants(payload.room.id) : [];
        const participants = [...existingParticipants, ...payload.room.participants, actor].filter((participant, index, users) => users.findIndex((user) => user.id === participant.id) === index);
        const room = { ...payload.room, participants };
        if (room.id !== "global" && roomExists(room.id) && !isRoomMember(room.id, actor.id, actor.name)) return null;
        saveRoom(room);
        payload.room = room;
      }
      break;
    case "message":
      if (payload.chatId && payload.message) {
        if (!roomExists(payload.chatId) && payload.room) saveRoom({ ...payload.room, participants: payload.room.participants.some((participant) => participant.id === actor.id) ? payload.room.participants : [...payload.room.participants, actor] });
        if (!isRoomMember(payload.chatId, actor.id, actor.name)) return null;
        payload.message = { ...payload.message, author: actor };
        saveMessage(payload.chatId, payload.message);
        console.log(`[message] saved id=${payload.message.id} room=${payload.chatId} image=${Boolean(payload.message.image)} imageBytes=${payload.message.image?.data.length ?? 0}`);
      }
      break;
    case "room-deleted":
      if (payload.roomId && payload.roomId !== "global" && isRoomMember(payload.roomId, actor.id, actor.name)) {
        database.query("DELETE FROM messages WHERE room_id = ?").run(payload.roomId);
        database.query("DELETE FROM rooms WHERE id = ?").run(payload.roomId);
      }
      break;
    case "message-deleted":
      if (payload.messageId && getMessageRoomId(payload.messageId) && getMessageRoomId(payload.messageId) !== undefined && isRoomMember(getMessageRoomId(payload.messageId)!, actor.id, actor.name)) {
        database.query("UPDATE messages SET text = ?, deleted = 1, edited = 0 WHERE id = ? AND author_id = ?").run("Diese Nachricht wurde gelöscht", payload.messageId, actor.id);
        payload.authorId = actor.id;
      }
      break;
    case "message-edited":
      if (payload.messageId && payload.text?.trim() && getMessageRoomId(payload.messageId) && isRoomMember(getMessageRoomId(payload.messageId)!, actor.id, actor.name)) {
        database.query("UPDATE messages SET text = ?, edited = 1 WHERE id = ? AND author_id = ? AND deleted = 0").run(payload.text.trim(), payload.messageId, actor.id);
        payload.authorId = actor.id;
      }
      break;
    case "message-reacted":
      if (payload.messageId && payload.emoji && getMessageRoomId(payload.messageId) && isRoomMember(getMessageRoomId(payload.messageId)!, actor.id, actor.name)) {
        const reactions = getMessageReactions(payload.messageId) ?? {};
        const users = reactions[payload.emoji] ?? [];
        const nextUsers = users.includes(actor.id) ? users.filter((userId) => userId !== actor.id) : [...users, actor.id];
        if (nextUsers.length === 0) delete reactions[payload.emoji];
        else reactions[payload.emoji] = nextUsers;
        database.query("UPDATE messages SET reactions_json = ? WHERE id = ? AND deleted = 0").run(JSON.stringify(reactions), payload.messageId);
        payload.reactions = reactions;
        payload.authorId = actor.id;
      }
      break;
    default:
      return null;
  }

  return JSON.stringify(payload);
}
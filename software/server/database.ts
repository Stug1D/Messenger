import { Database } from "bun:sqlite";

import type { Message, Room, User } from "../src/types";

// Die SQLite-Datei liegt lokal neben dem Server und enthält den dauerhaften Serverzustand.
export const database = new Database("messenger.sqlite");

// Legt das Schema beim Serverstart an, falls die Datenbank noch nicht existiert.
database.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    accent TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    initials TEXT NOT NULL,
    accent TEXT NOT NULL,
    participants_json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_json TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0,
    edited INTEGER NOT NULL DEFAULT 0,
    reactions_json TEXT NOT NULL DEFAULT '{}',
    image_json TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );
`);

// Ergänzt Felder älterer Datenbanken, ohne bestehende Installationen zu löschen.
try { database.run("ALTER TABLE messages ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0"); } catch {}
try { database.run("ALTER TABLE messages ADD COLUMN edited INTEGER NOT NULL DEFAULT 0"); } catch {}
try { database.run("ALTER TABLE messages ADD COLUMN reactions_json TEXT NOT NULL DEFAULT '{}'"); } catch {}
try { database.run("ALTER TABLE messages ADD COLUMN image_json TEXT"); } catch {}

export function saveUser(user: User) {
  // Aktualisiert einen Benutzer oder legt ihn bei der ersten Verwendung an.
  database.query("INSERT OR REPLACE INTO users (id, name, initials, accent) VALUES (?, ?, ?, ?)").run(user.id, user.name, user.initials, user.accent);
}

export function saveRoom(room: Room) {
  // Speichert den Raum und stellt sicher, dass alle Teilnehmer bekannt sind.
  room.participants.forEach(saveUser);
  database.query("INSERT OR REPLACE INTO rooms (id, name, initials, accent, participants_json) VALUES (?, ?, ?, ?, ?)").run(room.id, room.name, room.initials, room.accent, JSON.stringify(room.participants));
}

export function saveMessage(chatId: string, message: Message) {
  // Speichert Nachrichten idempotent, damit Reconnects keine Duplikate erzeugen.
  saveUser(message.author);
  database.query("INSERT OR IGNORE INTO messages (id, room_id, author_id, author_json, text, time, deleted, edited, reactions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(message.id, chatId, message.author.id, JSON.stringify(message.author), message.text, message.time, message.deleted ? 1 : 0, message.edited ? 1 : 0, JSON.stringify(message.reactions ?? {}));
  database.query("INSERT OR IGNORE INTO messages (id, room_id, author_id, author_json, text, time, deleted, edited, reactions_json, image_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(message.id, chatId, message.author.id, JSON.stringify(message.author), message.text, message.time, message.deleted ? 1 : 0, message.edited ? 1 : 0, JSON.stringify(message.reactions ?? {}), JSON.stringify(message.image ?? null));
}
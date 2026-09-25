import { describe, expect, it } from "bun:test";

import { canMutateMessage, createReplyReference, removePendingMessageAction, toggleUserReaction, upsertPendingMessageAction } from "./message-actions";
import type { Message, User } from "./types";

const author: User = {
  id: "user-1",
  name: "Mira",
  initials: "MI",
  accent: "coral",
};

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "message-1",
    author,
    text: "Originalnachricht",
    time: "10:00",
    ...overrides,
  };
}

describe("Offline-Replies", () => {
  it("behält den ursprünglichen Reply-Snapshot, wenn die Originalnachricht danach bearbeitet wird", () => {
    const originalMessage = createMessage();
    const reply = createReplyReference(originalMessage);
    const editedMessage = { ...originalMessage, text: "Bearbeitete Nachricht", edited: true };

    expect(reply).not.toBeNull();
    expect(reply?.messageId).toBe(editedMessage.id);
    expect(reply?.text).toBe("Originalnachricht");
  });

  it("behält eine Reply-Referenz, wenn die Originalnachricht offline gelöscht wird", () => {
    const originalMessage = createMessage();
    const reply = createReplyReference(originalMessage);
    const deletedMessage = { ...originalMessage, text: "Diese Nachricht wurde gelöscht", deleted: true };

    expect(reply?.messageId).toBe(deletedMessage.id);
    expect(reply?.text).toBe("Originalnachricht");
  });

  it("verhindert eine Reply auf eine bereits gelöschte Nachricht", () => {
    expect(createReplyReference(createMessage({ deleted: true }))).toBeNull();
  });

  it("bewahrt eine Bildreferenz, wenn die Antwort keinen Text enthält", () => {
    const reply = createReplyReference(createMessage({ text: "", image: { name: "photo.png", type: "image/png", data: "data:image/png;base64,test" } }));

    expect(reply?.imageName).toBe("photo.png");
    expect(reply?.text).toBe("");
  });
});

describe("Offline-Nachrichtenaktionen", () => {
  it("behält bei mehreren Offline-Aktionen nur die neueste Aktion derselben Nachricht", () => {
    const editedAction = { type: "message-edited" as const, chatId: "room-1", messageId: "message-1", authorId: "user-1", text: "Neu" };
    const deletedAction = { type: "message-deleted" as const, chatId: "room-1", messageId: "message-1", authorId: "user-1" };
    const actions = upsertPendingMessageAction([editedAction], deletedAction);

    expect(actions).toEqual([deletedAction]);
  });

  it("entfernt eine Aktion nach der Serverbestätigung", () => {
    const action = { type: "message-reacted" as const, chatId: "room-1", messageId: "message-1", authorId: "user-1", emoji: "👍" };

    expect(removePendingMessageAction([action], "message-1")).toEqual([]);
  });

  it("behält Aktionen für unterschiedliche Nachrichten getrennt", () => {
    const first = { type: "message-deleted" as const, chatId: "room-1", messageId: "message-1", authorId: "user-1" };
    const second = { type: "message-edited" as const, chatId: "room-1", messageId: "message-2", authorId: "user-1", text: "Neu" };

    expect(upsertPendingMessageAction([first], second)).toEqual([first, second]);
  });
});

describe("Nachrichtenberechtigungen und Reaktionen", () => {
  it("erlaubt Änderungen nur dem Autor einer aktiven Nachricht", () => {
    const message = createMessage();

    expect(canMutateMessage(message, "user-1")).toBe(true);
    expect(canMutateMessage(message, "user-2")).toBe(false);
    expect(canMutateMessage({ ...message, deleted: true }, "user-1")).toBe(false);
  });

  it("fügt eine Reaktion hinzu und entfernt sie beim zweiten Klick", () => {
    const initial = { "👍": ["user-2"] };
    const added = toggleUserReaction(initial, "user-1", "❤️");
    const removed = toggleUserReaction(added, "user-1", "❤️");

    expect(added["❤️"]).toEqual(["user-1"]);
    expect(removed).toEqual(initial);
    expect(initial).toEqual({ "👍": ["user-2"] });
  });
});

//was passiert wenn zwie tabs mit 2 accounts

//session nach reload beahlten
//mit 2 aacounts

//was passiet wenn ich eine nachricht lösche und die andere tab die nachricht noch hat

// was passiert wenn x leute gliechzeitig sachen schicken oder accounts erstellung
//kann db und sevrer mithalten

//bleit man für immer angemeldet oder muss man sich irgendwann neu anmelden

//was passiert wenn ich mich in einem tab abmelde und im anderen tab noch angemeldet bin
//werdne dann beid abgemeldet oder nur in einem tab


//generell neuladen
//wenn ich eine lange nachricht in den chat schreibe und dann reloade ist sie dann weg
//wenn ich seit eneu lade bleiben alle chats 
//wenn ich eine nachricht lösche oder bearbeite wird das in der üebrsicht auch direkt angezeigt

//generell login : siete währedn des login vorgängs neuladen falsches passowrt zu kruzes passwort

// //was könnte passieren damit daten auf de rlocalstorage verloren gehen ungültige mail
//broswerdaten löschen,ikgonito modus, browser speicher
//db müsste snapshot mit wichtigsten daten schicken

//was wenn die db datei beschädigt ist oder gelöscht wird
//was passiert wenn der server abstürzt oder die db datei gelöscht wird
//kann man dann noch auf die daten zugreifen
//sicherhiet im allgmeinen 






import type { Room } from "./types";

export const starterChats: Room[] = [
  {
    id: "global",
    name: "Global",
    initials: "GL",
    accent: "coral",
    preview: "Noch keine Nachrichten",
    time: "",
    participants: [],
    messages: [],
  },
];

export const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Liefert die Uhrzeit im Format, das in Nachrichtenblasen angezeigt wird.
export function now() {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}
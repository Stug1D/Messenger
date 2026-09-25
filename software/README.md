
# Messenger implementation

## Starten

Abhaengigkeiten installieren:

```bash
bun install
```

React/Vite in einem Terminal starten:

```bash
bun run dev
```

Den WebSocket- und SQLite-Server in einem zweiten Terminal starten:

```bash
bun run server
```

Die Oberflaeche ist danach unter `http://localhost:5173/` erreichbar. Sie funktioniert auch ohne Server lokal weiter und synchronisiert offene Aenderungen beim Reconnect.

Nachrichten, Bearbeitungen, Loeschungen, Reaktionen, Antworten, Bilder und neue Raeume werden zuerst in `localStorage` gespeichert. Sobald der WebSocket-Server erreichbar ist, werden offene Aenderungen an `messenger.sqlite` uebertragen.

## Struktur

- `src/App.tsx`: React-State, Persistence und Auswahl der Ansicht
- `src/components/`: Login-, Chatlisten- und Konversationsansicht
- `src/hooks/useChatActions.ts`: Benutzeraktionen fuer Login, Raeume, Nachrichten, Bilder, Antworten und Reaktionen
- `src/hooks/useMessengerSocket.ts`: WebSocket, Reconnect, Presence und Synchronisation
- `src/data.ts`: Starterraum, Emoji-Liste und Zeitformatierung
- `src/types.ts`: zentrale Typen fuer User, Message, Room, Bilder und Reply-Referenzen
- `src/storage.ts`: localStorage-Zustand und Offline-Warteschlangen
- `src/styles.css`: responsive Oberflaeche und Nachrichtenlayout
- `server/index.ts`: Bun-WebSocket-Einstiegspunkt und Broadcast
- `server/message-handler.ts`: Verarbeitung der WebSocket-Anfragen
- `server/database.ts`: SQLite-Schema, Migrationen und SQL-Persistenz
- `server/types.ts`: Server-Payloads und Verbindungsdaten
- `messenger.sqlite`: lokale SQLite-Datenbank des Servers; wird nicht versioniert

## Evaluationshinweise

- Bilder muessen einen `image/*`-MIME-Type besitzen und duerfen maximal 5 MB gross sein.
- Der Raum `Global` ist geschuetzt und kann nicht geloescht werden.
- Accounts werden ueber Better Auth mit E-Mail, Passwort und SQLite-Sessions verwaltet.
- Lesebestaetigungen und Tippindikatoren sind noch nicht umgesetzt.
- Checks aus diesem Ordner: `bunx tsc --noEmit` und `bun run build`.


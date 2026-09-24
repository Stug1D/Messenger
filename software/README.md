
# Messenger software

## Starten

Terminal 1 startet die React-Oberflaeche:

```bash
bun install
bun run dev
```

Terminal 2 startet den WebSocket-Server:

```bash
bun run server
```

Die Oberflaeche ist danach unter `http://localhost:5173` erreichbar. Ohne Server startet die Oberflaeche ebenfalls und zeigt Nachrichten lokal an.

Nachrichten, Bearbeitungen, Loeschungen und neue Raeume werden zuerst im Browser in `localStorage` gespeichert. Sobald der WebSocket-Server erreichbar ist, werden offene Aenderungen an den Server uebertragen und in `messenger.sqlite` persistiert.

## Struktur

- `src/App.tsx`: Login, Chatliste, Chatansicht und Nachrichtenlogik
- `src/types.ts`: zentrale Typen fuer `User`, `Message` und `Room`
- `src/styles.css`: responsive Oberflaeche
- `src/storage.ts`: localStorage-Zustand und Offline-Warteschlangen
- `server/index.ts`: Bun-WebSocket-Server und Client-Verbindungen
- `server/message-handler.ts`: Verarbeitung der WebSocket-Anfragen
- `server/database.ts`: SQLite-Schema und Persistenzfunktionen
- `server/types.ts`: Server-Payloads und Clientdaten
- `messenger.sqlite`: lokale SQLite-Datenbank des Servers (wird nicht versioniert)

This project was created using `bun init` in bun v1.4.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

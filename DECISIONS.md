# Decisions

Dieses Dokument protokolliert die technischen Entscheidungen und ihre Begruendung. Neue Entscheidungen werden chronologisch ergaenzt.

## 2026-09-24 - Projektgrundlage


## 2026-09-24 - Erste Messenger-Oberflaeche


## 2026-09-24 - Domänenmodelle
- **Erstellungsflow:** Der Plus-Button oeffnet ein Modal mit Raumname und Teilnehmerliste.
- **Einzel- und Gruppenchat:** Ein Teilnehmer erzeugt einen direkten Chat, mehrere Teilnehmer einen Gruppenchat. Die Daten werden einheitlich als `Room` gespeichert.
- **Eigener Nutzer:** Der aktuell eingeloggte Nutzer wird bei jeder neuen Konversation automatisch als Teilnehmer aufgenommen.
- **Eingabeformat:** Teilnehmer koennen durch Kommas oder Zeilenumbrueche getrennt eingetragen werden; doppelte Namen werden innerhalb der neuen Konversation entfernt.
- **Nach Erstellung:** Der neue Raum wird der Chatliste hinzugefuegt und direkt geoeffnet.
- **Validierung:** `bun run build` laeuft nach der Erweiterung erfolgreich.

- **Eigene Typdatei:** `src/types.ts` ist die zentrale Stelle fuer die Datenmodelle `User`, `Message` und `Room`.
- **User:** Ein Benutzer besitzt eine stabile `id`, einen Anzeigenamen sowie UI-Metadaten fuer Initialen und Akzentfarbe.

- **Typaufloesung:** `ServerWebSocket` wird in `server.ts` explizit aus `bun` importiert, statt auf eine globale Typdefinition zu vertrauen. Dadurch funktioniert die Aufloesung auch direkt im TypeScript-Editor.
- **Validierung:** Der WebSocket-Server startet erfolgreich und der Vite-Build bleibt erfolgreich.

- **Raeume:** Die vorgefertigten Beispielraeume wurden entfernt. Die Anwendung startet jetzt mit genau einem leeren Raum namens `Global`.
- **Teilnehmer:** Beim Login wird der neue `User` automatisch zur Teilnehmerliste des globalen Raums hinzugefuegt.

- **TypeScript-Library:** `DOM` wurde neben `ESNext` in `tsconfig.json` aktiviert, weil der React-Einstieg Browser-APIs wie `document` und `WebSocket` verwendet.
- **Validierung:** Der Vite-Build laeuft nach der Konfigurationsaenderung erfolgreich.

## 2026-09-24 - Vite-Umgebungsdeklaration

- **Typisierung:** `src/vite-env.d.ts` referenziert `vite/client`, damit TypeScript CSS-Side-Effect-Imports wie `import "./styles.css"` korrekt erkennt.
- **Validierung:** `bun run build` laeuft nach dem Fix erfolgreich.

## 2026-09-24 - Offline-first und SQLite

- **Lokaler Vorrang:** Neue Nutzer, Raeume und Nachrichten werden zuerst in `localStorage` gespeichert. Nachrichten und Raeume bleiben bei einer unterbrochenen Verbindung in einer lokalen Warteschlange.
- **Synchronisation:** Sobald der WebSocket wieder verbunden ist, werden offene Raeume und Nachrichten an den Server gesendet. Empfangene Nachrichten werden anhand ihrer ID dedupliziert.
- **Serverdatenbank:** Der Bun-Server verwendet `bun:sqlite` und speichert Nutzer, Raeume und Nachrichten in `messenger.sqlite`.
- **Versionierung:** Die lokale SQLite-Datei wird ueber `.gitignore` ausgeschlossen, weil sie Laufzeitdaten enthaelt.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## Dateiübersicht

### Repository

- `README.md`: ursprüngliche Aufgabenbeschreibung und Abgaberegeln.
- `DECISIONS.md`: chronologische technische Entscheidungen und diese Dateiübersicht.

### Projektkonfiguration

- `software/package.json`: Abhängigkeiten und Scripts für Vite, React und den Bun-Server.
- `software/bun.lock`: von Bun erzeugte Lockdatei für reproduzierbare Abhängigkeiten.
- `software/tsconfig.json`: TypeScript-, React- und DOM-Typkonfiguration.
- `software/vite-env.d.ts`: Vite-Typen für CSS-Imports und `import.meta.env`.
- `software/index.html`: HTML-Einstiegspunkt für Vite.
- `software/.gitignore`: schließt Abhängigkeiten, Builds und lokale SQLite-Daten aus Git aus.
- `software/README.md`: ursprüngliche Bun-README-Datei.

### Frontend-Einstieg und Daten

- `software/src/main.tsx`: React-Root; rendert `App` und lädt globale Styles.
- `software/src/App.tsx`: Orchestrator; hält React-State, persistiert Snapshots, berechnet Presence und wählt die aktuelle Ansicht.
- `software/src/types.ts`: gemeinsame Domänentypen für `User`, `Message`, `Room`, Bildanhänge und Reply-Referenzen.
- `software/src/data.ts`: geschützter globaler Starterraum, Emoji-Liste und Zeitformatierung.
- `software/src/storage.ts`: Laden und Speichern des Offline-Zustands in `localStorage` sowie Pending-Typen.
- `software/src/styles.css`: Layout, responsive Darstellung, Nachrichten, Composer, Reaktionen und Modals.

### Frontend-Komponenten

- `software/src/components/LoginScreen.tsx`: Namenseingabe und Login-Oberfläche.
- `software/src/components/ChatListScreen.tsx`: Chatübersicht, Logout und Raum-Erstellungsdialog.
- `software/src/components/ConversationScreen.tsx`: Nachrichtenverlauf, Online-Status, Antworten, Reaktionen, Bilder und Composer.

### Frontend-Hooks

- `software/src/hooks/useChatActions.ts`: Login, Logout, Nachrichten-, Bild-, Raum-, Reply- und Reaktionsaktionen.
- `software/src/hooks/useMessengerSocket.ts`: WebSocket-Verbindung, Reconnect, Presence, Serverereignisse und Offline-Synchronisation.

### Server

- `software/server/index.ts`: Bun-WebSocket-Einstiegspunkt, Verbindungsverwaltung und Broadcast an Clients.
- `software/server/message-handler.ts`: JSON-Payload-Verarbeitung mit `switch` und Weiterleitung der passenden SQLite-Aktion.
- `software/server/database.ts`: SQLite-Verbindung, Schema, Migrationen sowie Speicherfunktionen für Nutzer, Räume und Nachrichten.
- `software/server/types.ts`: Server-Payloads und Verbindungsdaten.
- `software/messenger.sqlite`: lokale SQLite-Laufzeitdatenbank; wird nicht versioniert.

### Generierte Dateien

- `software/dist/`: Produktionsausgabe von Vite; wird bei `bun run build` erzeugt.
- `software/node_modules/`: installierte Abhängigkeiten; wird durch `bun install` erzeugt.

## 2026-09-24 - App-Logik in Hooks ausgelagert

- **WebSocket-Hook:** `src/hooks/useMessengerSocket.ts` bündelt Verbindung, Reconnect, Presence, Serverereignisse und Pending-Synchronisation.
- **Action-Hook:** `src/hooks/useChatActions.ts` bündelt Login, Logout, Nachrichten-, Bild-, Reaktions-, Reply- und Raumaktionen.
- **App-Orchestrator:** `App.tsx` verwaltet den React-State, persistiert Snapshots, berechnet den aktuellen Presence-Kontext und reicht Props an die drei Ansichten weiter.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Einzelchat-Anzeige

- **Regel:** Besteht ein Raum aus genau dem aktuellen Nutzer und einem weiteren Teilnehmer, wird dessen Name mit `ist online` oder `ist offline` angezeigt.
- **Gruppen:** Bei mehr als einem weiteren Teilnehmer bleibt die Anzeige bei der Anzahl der online befindlichen Personen.
- **Identitaet:** Der aktuelle Nutzer wird bei der Teilnehmerzaehlung sowohl ueber ID als auch Namen ausgeschlossen.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Presence für bestehende Räume

- **Kompatibilität:** Für ältere lokal gespeicherte Räume werden zusätzlich die Autoren vorhandener Nachrichten als bekannte Teilnehmer berücksichtigt.
- **Zuordnung:** Online-Nutzer werden über ID oder normalisierten Namen mit Raumteilnehmern abgeglichen.
- **Server:** Der Presence-Server sendet beim Verbinden bereits bekannte online Nutzer an den neuen Client.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich; der aktualisierte Server läuft auf Port 3001.

## 2026-09-24 - Online-Status von Teilnehmern

- **Presence:** Der Client meldet seinen User beim WebSocket-Server an. Der Server verteilt Presence-Ereignisse beim Verbinden und Trennen.
- **Einzelchat:** Bei genau einem Gegenüber wird `Name ist online` beziehungsweise `Name ist offline` angezeigt.
- **Gruppenchat:** Bei mehreren Teilnehmern wird die Anzahl der aktuell online erkannten Personen angezeigt.
- **Geräteübergreifend:** Teilnehmer werden neben der ID auch über den Namen zugeordnet, damit der Status bei unterschiedlichen lokalen User-IDs sichtbar werden kann.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Antworten auf Nachrichten

- **Auswahl:** Jede nicht geloeschte Nachricht kann ueber `Reply` als Antwortziel ausgewaehlt werden.
- **Composer:** Die ausgewaehlte Nachricht wird oberhalb des Eingabefelds mit Autor und Vorschautext angezeigt und kann dort wieder entfernt werden.
- **Nachricht:** Eine Antwort speichert eine kompakte `replyTo`-Referenz mit Nachrichten-ID, Autor und Inhalt bzw. Bildname.
- **Darstellung:** Im Verlauf wird diese Referenz oberhalb der Antwort als Zitatblock angezeigt.
- **Persistenz:** Die Referenz wird zusammen mit der Nachricht lokal und in SQLite gespeichert.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Dezente Scrollleiste

- **Darstellung:** Die Nachrichten-Scrollleiste ist schmal, transparent hinterlegt und nur beim Hover etwas sichtbarer.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Nachrichtenliste scrollbar gemacht

- **Problem:** Die vorherige Ausrichtung am unteren Rand konnte den oberen Teil langer Nachrichtenverläufe unzugänglich machen.
- **Loesung:** Die Nachrichtenliste verwendet jetzt normalen Startfluss mit eigenem vertikalem Overflow-Scrollbereich.
- **Eingabe:** Der Composer bleibt weiterhin außerhalb der Liste sichtbar.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Konversationskopf reduziert

- **Anzeige:** Im Nachrichtenbereich bleibt nur der Tagestrenner `Today` sichtbar.
- **Entfernt:** Der wiederholte Raumtitel und der technische Hinweis `Messages are shared in real time.` wurden entfernt.
- **Scrollen:** Die Nachrichtenliste bleibt der scrollbare Bereich, während der Composer sichtbar bleibt.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Fixierter Nachrichten-Composer

- **Scrollbereich:** Nur die Nachrichtenliste scrollt innerhalb der Chatansicht.
- **Eingabe:** Der Composer bleibt am unteren Rand sichtbar, damit Nachrichten jederzeit gesendet und Bilder angehaengt werden koennen.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Bildnachrichten

- **Dateityp:** Nutzer koennen Bilddateien ueber den Composer auswaehlen und zusammen mit Text oder allein senden.
- **Groessenlimit:** Dateien groesser als 5 MB oder Dateien ohne `image/*`-MIME-Type werden vor dem Lesen abgelehnt und mit einer Fehlermeldung angezeigt.
- **Entfernen:** Eine ausgewaehlte Datei kann vor dem Senden ueber `Remove` wieder aus dem Composer entfernt werden.
- **Speicherung:** Bilder werden als Data-URL in der Message lokal gespeichert und in SQLite als `image_json` persistiert.
- **Vorschau:** Bildnachrichten zeigen im Chat das Bild und in der Raumuebersicht die Vorschau `Bild`.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - React-Ansichten ausgelagert

- **App-Verantwortung:** `App.tsx` enthält weiterhin Zustand, WebSocket-Synchronisation und fachliche Aktionen.
- **UI-Komponenten:** Login, Chatübersicht und Konversation liegen separat in `src/components/` und erhalten Daten sowie Aktionen über Props.
- **Daten:** Starterraum, Emoji-Liste und Zeitformat liegen in `src/data.ts`.
- **Ziel:** Die lange App-Datei bleibt als Orchestrator lesbar, während jede Ansicht unabhängig nachvollzogen und angepasst werden kann.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - WebSocket-Reconnect

- **Problem:** Wenn der Server beim Login nicht erreichbar war, blieb der Client offline, weil nur ein einziger Verbindungsversuch gestartet wurde.
- **Loesung:** Der Client versucht nach einer getrennten Verbindung automatisch alle Sekunden erneut, den WebSocket zu oeffnen.
- **Status:** Bei erfolgreicher Verbindung wird der eigene Status auf `Online`, bei Verbindungsabbruch auf `Offline` gesetzt.
- **Cleanup:** Beim Logout oder beim Unmount werden Reconnect-Timer und aktive WebSockets beendet.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Eigener Chat-Status

- **Chat-Header:** Der Raumname zeigt keine technische `Live connection`-Meldung mehr.
- **Eigener Nutzer:** Rechts oben werden der eigene Name und der aktuelle Status `Online` oder `Offline` angezeigt.
- **Ausblick:** Online-Status von Gesprächspartnern und Gruppenmitgliedern bleibt fuer eine spaetere Presence-Funktion vorgesehen.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Emoji-Reaktionen

- **Auswahl:** Nutzer koennen Nachrichten mit `👍`, `❤️`, `😂`, `😮`, `😢` und `🙏` markieren.
- **Toggle:** Eine Reaktion kann erneut angeklickt und dadurch vom eigenen User entfernt werden. Die Anzahl der Reaktionen wird direkt an der Nachricht angezeigt.
- **Persistenz:** Reaktionen werden zuerst lokal gespeichert und ueber `message-reacted` an SQLite und alle verbundenen Tabs synchronisiert.
- **Gelöschte Nachrichten:** Gelöschte Nachrichten koennen nicht mehr reagiert werden.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Logout

- **Sitzung:** Die Chatuebersicht besitzt einen Logout-Button, der den aktuellen User aus dem React-Zustand entfernt und die WebSocket-Verbindung schliesst.
- **Lokale Daten:** Raeume, Nachrichten und Offline-Warteschlangen bleiben erhalten und werden nicht mit der Sitzung geloescht.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Vorschau geloeschter Nachrichten

- **Chatuebersicht:** Wenn eine Nachricht geloescht wird, zeigt die Vorschau des zugehoerigen Raums `Diese Nachricht wurde geloescht`.
- **Synchronisation:** Die Vorschau wird sowohl bei der lokalen Aktion als auch bei einem `message-deleted`-Ereignis aus einem anderen Tab aktualisiert.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Serverstruktur aufgeteilt

- **Aufteilung:** Der Server liegt jetzt im Ordner `server/` und ist in Einstiegspunkt, Datenbank, Payload-Typen und Nachrichtenverarbeitung getrennt.
- **`index.ts`:** Verwaltet Bun, WebSocket-Verbindungen und den Broadcast.
- **`database.ts`:** Verwaltet SQLite-Schema und Persistenzfunktionen.
- **`message-handler.ts`:** Verarbeitet die einzelnen Anfragearten per `switch`.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen nach der Aufteilung erfolgreich.

## 2026-09-24 - Globaler Raum geschuetzt

- **Systemraum:** `Global` ist ein nicht loeschbarer Raum und wird beim Laden der App immer wiederhergestellt, falls er aus einem alten lokalen Zustand fehlt.
- **Teilnehmer:** Der aktuelle Nutzer wird beim Login automatisch wieder als Teilnehmer des globalen Raums eingetragen.
- **Server:** Der Server persistiert `Global` bei jeder Verbindung erneut und ignoriert `room-deleted`-Anfragen fuer diese Raum-ID.
- **Oberflaeche:** Der Loeschbutton wird im globalen Raum nicht angezeigt.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Zentrale Server-Nachrichtenverarbeitung

- **Struktur:** Eine zentrale `message()`-Funktion in `server.ts` parst eingehende WebSocket-Payloads und behandelt sie übersichtlich per `switch`.
- **Verantwortung:** Jeder Case enthält nur die passende SQLite-Aktion; der WebSocket-Callback übernimmt anschließend ausschließlich Validierungsergebnis und Broadcast an die Clients.
- **Robustheit:** Ungültiges JSON oder unbekannte Nachrichtentypen werden verworfen und nicht an andere Clients weitergeleitet.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Eigene Nachrichten bearbeiten und loeschen

- **Eigene Nachrichten:** Nur Nachrichten des aktuell eingeloggten Users zeigen die Aktionen `Edit` und `Delete`.
- **Loeschen:** Die Nachricht bleibt im Verlauf erhalten, wird aber durch `Diese Nachricht wurde geloescht` ersetzt. Der Status wird lokal und in SQLite gespeichert und an alle verbundenen Tabs broadcastet.
- **Bearbeiten:** Der Text wird lokal aktualisiert und mit dem Status `edited` versehen. Die gleiche Aenderung wird anschliessend an SQLite und alle verbundenen Tabs synchronisiert.
- **Offline-first:** Bearbeitungs- und Loeschaktionen werden in `localStorage` zwischengespeichert und beim naechsten Reconnect an den Server gesendet.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Chat-Suche entfernt

- **Oberflaeche:** Die Chat-Suchfunktion wurde aus der Chatliste entfernt, weil sie fuer den aktuellen Funktionsumfang nicht benoetigt wird.
- **Validierung:** `bun run build` laeuft nach der Entfernung erfolgreich.

## 2026-09-24 - Konversationen loeschen

- **Berechtigung:** Jeder Nutzer sieht in einer geoeffneten Konversation eine Loeschaktion.
- **Offline-first:** Beim Loeschen werden Raum, Nachrichten und lokale Synchronisationsaufgaben sofort aus `localStorage` entfernt. Die Raum-ID wird als offene Loeschung gespeichert.
- **Server-Synchronisation:** Bei bestehender Verbindung oder beim naechsten Reconnect wird `room-deleted` gesendet. Der Server loescht zuerst alle Nachrichten und danach den Raum aus SQLite und broadcastet die Loeschung an alle Tabs.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen erfolgreich.

## 2026-09-24 - Alten Bun-Starter entfernt

- **Aufraeumen:** `software/index.ts` wurde entfernt, weil die Anwendung ueber Vite mit `src/main.tsx` und der Server separat ueber `server.ts` gestartet wird.
- **Validierung:** `bunx tsc --noEmit` und `bun run build` laufen weiterhin erfolgreich.
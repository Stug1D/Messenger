import type { ServerWebSocket } from "bun";

import { handleMessage } from "./message-handler";
import type { ClientData } from "./types";
import type { User } from "../src/types";

const clients = new Set<ServerWebSocket<ClientData>>();

// Der Einstiegspunkt kümmert sich nur um Verbindungslifecycle und Broadcasts.
const server = Bun.serve<ClientData>({
  port: 3001,
  fetch(request, serverInstance) {
    if (serverInstance.upgrade(request, { data: { id: crypto.randomUUID() } })) return;
    return new Response("Messenger WebSocket server", { status: 200 });
  },
  websocket: {
    open(socket) {
      clients.add(socket);
    },
    message(_socket, rawMessage) {
      // Die fachliche Verarbeitung bleibt in message-handler.ts getrennt.
      const payload = JSON.parse(String(rawMessage)) as { type?: string; user?: User };
      if (payload.type === "presence" && payload.user) {
        for (const client of clients) {
          if (client !== _socket && client.data.user) _socket.send(JSON.stringify({ type: "presence", user: client.data.user, online: true }));
        }
        _socket.data.userId = payload.user.id;
        _socket.data.user = payload.user;
        for (const client of clients) client.send(JSON.stringify({ type: "presence", user: payload.user, online: true }));
        return;
      }

      const response = handleMessage(String(rawMessage));
      if (!response) return;
      for (const client of clients) client.send(response);
    },
    close(socket) {
      clients.delete(socket);
      if (socket.data.userId) {
        for (const client of clients) client.send(JSON.stringify({ type: "presence", userId: socket.data.userId, online: false }));
      }
    },
  },
});

console.log(`WebSocket server listening on ws://localhost:${server.port}`);
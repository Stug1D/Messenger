import type { ServerWebSocket } from "bun";

import { handleMessage } from "./message-handler";
import { auth } from "./auth";
import type { ClientData } from "./types";
import type { User } from "../src/types";

const clients = new Set<ServerWebSocket<ClientData>>();

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "http://localhost:5173");
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(response.body, { status: response.status, headers });
}

// Der Einstiegspunkt kümmert sich nur um Verbindungslifecycle und Broadcasts.
const server = Bun.serve<ClientData>({
  port: 3001,
  async fetch(request, serverInstance) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/auth")) {
      if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204, headers: { "Access-Control-Allow-Headers": "Content-Type, Cookie, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } }));
      return withCors(await auth.handler(request));
    }

    const authHeaders = new Headers(request.headers);
    const sessionToken = url.searchParams.get("sessionToken");
    if (sessionToken) authHeaders.set("authorization", `Bearer ${sessionToken}`);
    const session = await auth.api.getSession({ headers: authHeaders });
    if (!session) return new Response("Unauthorized", { status: 401 });
    const user: User = { id: session.user.id, name: session.user.name, initials: session.user.name.slice(0, 2).toUpperCase(), accent: "coral" };
    if (serverInstance.upgrade(request, { data: { id: crypto.randomUUID(), userId: user.id, user } })) return;
    return new Response("Messenger WebSocket server", { status: 200 });
  },
  websocket: {
    open(socket) {
      clients.add(socket);
    },
    message(_socket, rawMessage) {
      // Die fachliche Verarbeitung bleibt in message-handler.ts getrennt.
      if (String(rawMessage).length > 8 * 1024 * 1024) return;
      let payload: { type?: string };
      try { payload = JSON.parse(String(rawMessage)) as { type?: string }; } catch { return; }
      if (payload.type === "presence" && _socket.data.user) {
        const presenceUser = _socket.data.user;
        for (const client of clients) {
          if (client !== _socket && client.data.user) _socket.send(JSON.stringify({ type: "presence", user: client.data.user, online: true }));
        }
        for (const client of clients) client.send(JSON.stringify({ type: "presence", user: presenceUser, online: true }));
        return;
      }

      if (!_socket.data.user) return;
      const response = handleMessage(String(rawMessage), _socket.data.user);
      if (!response) return;
      console.log(`[broadcast] type=${payload.type ?? "unknown"} clients=${clients.size}`);
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
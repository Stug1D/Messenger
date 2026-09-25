const AUTH_URL = "http://localhost:3001/api/auth";
const AUTH_TOKEN_KEY = "messenger-auth-token";
const AUTH_USER_KEY = "messenger-auth-user";

type AuthResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  session?: unknown;
};

async function authRequest(path: string, body?: Record<string, string>) {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(body ? { "Content-Type": "application/json" } : undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${AUTH_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const nextToken = response.headers.get("set-auth-token");
  if (nextToken) sessionStorage.setItem(AUTH_TOKEN_KEY, nextToken);
  const data = await response.json().catch(() => ({})) as AuthResponse & { message?: string };
  if (data.user) sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  if (!response.ok) throw new Error(data.message ?? "Authentifizierung fehlgeschlagen.");
  return data;
}

export function signUp(email: string, password: string, name: string) {
  return authRequest("/sign-up/email", { email, password, name });
}

export function signIn(email: string, password: string) {
  return authRequest("/sign-in/email", { email, password });
}

export function getSession() {
  return authRequest("/get-session");
}

export function signOut() {
  return authRequest("/sign-out", {}).finally(() => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  });
}

export function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthUser() {
  const storedUser = sessionStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;
  try { return JSON.parse(storedUser) as NonNullable<AuthResponse["user"]>; }
  catch { return null; }
}

import type { ApiMessage, Reference, Session, User } from "./types";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ??
  "http://localhost:8001/api/v1";

// ─── Token helpers ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getToken();

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type");

    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      throw new Error(
        `API mengembalikan ${contentType || "non-JSON"} bukan JSON. Status: ${response.status}`
      );
    }

    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`;
      try {
        const data = (await response.json()) as { detail?: string; message?: string };
        if (data?.detail) message = data.detail;
        else if (data?.message) message = data.message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`❌ API Error [${init?.method || "GET"} ${path}]:`, error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Server sedang mati atau gangguan");
    }
    throw error;
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const data = await apiFetch<{ access_token: string; token_type: string; user: User }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );
  return { token: data.access_token, user: data.user };
}

export async function getProfile(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

// ─── Sessions ─────────────────────────────────────────────────────────────

export async function getSessions(limit?: number): Promise<Session[]> {
  const queryParams = limit ? `?limit=${limit}` : "";
  return apiFetch<Session[]>(`/sessions/${queryParams}`);
}

export async function getSessionDetail(sessionId: number) {
  return apiFetch<{ id: number; title: string; messages: ApiMessage[] }>(
    `/sessions/${sessionId}`
  );
}

export async function deleteSession(sessionId: number) {
  return apiFetch<{ message: string }>(`/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

// ─── Chat ──────────────────────────────────────────────────────────────────

type SendMessagePayload = {
  query: string;
  session_id: number | null;
  selected_paper_ids?: string[];
  faculty?: string;
  department?: string;
  document_type?: string;
  year?: number;
  year_range?: {
    start: number;
    end: number;
  };
};

type SendMessageResponse = {
  session_id: number;
  message_id: number;
  ai_response: string;
  references: Reference[];
  metadata: Record<string, unknown>;
};

export async function sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
  return apiFetch<SendMessageResponse>("/chat/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Master data ───────────────────────────────────────────────────────────

export async function getFaculties(): Promise<string[]> {
  return apiFetch<string[]>("/master/faculties");
}

export async function getDepartments(): Promise<string[]> {
  return apiFetch<string[]>("/master/departments");
}

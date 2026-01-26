import type { ApiMessage, Reference, Session } from "./types";

// Trim and clean BASE_URL to handle accidental spaces in .env
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ??
  "http://localhost:8001/api/v1";

// Debug: Log BASE_URL and all env vars on app start
if (import.meta.env.DEV) {
  console.log("🔗 API Base URL:", BASE_URL);
  console.log("📋 Raw VITE_API_BASE_URL:", `"${import.meta.env.VITE_API_BASE_URL}"`);
  console.log("👤 User ID:", import.meta.env.VITE_USER_ID ?? "user_12345");
}

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

async function apiFetch<T>(path: string, userId: string, init?: RequestInit) {
  const url = `${BASE_URL}${path}`;
  
  // Debug log API calls in development
  if (import.meta.env.DEV) {
    console.log(`🌐 ${init?.method || "GET"} ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": userId,
        // Ngrok requires this header to bypass warning page
        "ngrok-skip-browser-warning": "true",
        ...(init?.headers ?? {}),
      },
    });

    if (import.meta.env.DEV) {
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Content-Type: ${response.headers.get("content-type")}`);
    }

    const contentType = response.headers.get("content-type");
    
    // Check if response is JSON
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
        const data = (await response.json()) as { message?: string };
        if (data?.message) message = data.message;
      } catch {
        // Ignore JSON parse errors for error response
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`❌ API Error [${init?.method || "GET"} ${path}]:`, error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Tidak dapat terhubung ke ${url}`
      );
    }
    throw error;
  }
}

export async function getSessions(userId: string, limit = 50) {
  console.log("[API] getSessions called with userId:", userId, "limit:", limit);
  
  // Use trailing slash directly to avoid FastAPI redirect
  // FastAPI redirects /sessions → /sessions/ which breaks CORS preflight
  try {
    const result = await apiFetch<Session[]>(`/sessions/?limit=${limit}`, userId, {
      method: "GET",
    });
    console.log("[API] getSessions SUCCESS - Response:", result);
    console.log("[API] Number of sessions:", result.length);
    if (result.length > 0) {
      console.log("[API] First session sample:", result[0]);
    }
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] getSessions FAILED:", errorMsg);
    
    // If CORS/redirect error, add helpful message
    if (errorMsg.includes("CORS") || errorMsg.includes("Network error") || errorMsg.includes("Redirect")) {
      console.error(
        "⚠️ FastAPI Auto-Redirect Issue:\n" +
        "Backend redirect /sessions → /sessions/ breaks CORS preflight.\n\n" +
        "Fix backend dengan salah satu cara:\n" +
        "1. app = FastAPI(redirect_slashes=False)\n" +
        "2. Support both @app.get('/sessions') and @app.get('/sessions/')"
      );
    }
    
    throw error;
  }
}

export async function getSessionDetail(userId: string, sessionId: number) {
  return apiFetch<{ id: number; title: string; messages: ApiMessage[] }>(
    `/sessions/${sessionId}`,
    userId
  );
}

export async function sendMessage(userId: string, payload: SendMessagePayload) {
  return apiFetch<SendMessageResponse>("/chat/send", userId, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Master data endpoints
export async function getFaculties(userId: string) {
  const url = `${BASE_URL}/master/faculties`;
  
  if (import.meta.env.DEV) {
    console.log(`🌐 GET ${url}`);
  }
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": userId,
      "ngrok-skip-browser-warning": "true",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch faculties: ${response.statusText}`);
  }
  
  return (await response.json()) as string[];
}

export async function getDepartments(userId: string) {
  const url = `${BASE_URL}/master/departments`;
  
  if (import.meta.env.DEV) {
    console.log(`🌐 GET ${url}`);
  }
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": userId,
      "ngrok-skip-browser-warning": "true",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch departments: ${response.statusText}`);
  }
  
  return (await response.json()) as string[];
}


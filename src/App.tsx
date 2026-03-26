import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import LoginPage from "@/components/LoginPage";
import type { Message, SelectedPaper, Session, ActiveFilters, User } from "@/lib/types";
import {
  BASE_URL,
  getToken,  
  getSessionDetail,
  getSessions,
  login as apiLogin,
  clearAuth,
  saveAuth,
  getStoredUser,
  isTokenValid,
} from "@/lib/api";

const EMPTY_FILTERS: ActiveFilters = {
  faculty: null,
  department: null,
  document_type: null,
  year: null,
  year_range: {
    start: null,
    end: null,
  },
};

export default function App() {
  // ─── Auth state ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(() => {
    // Restore from localStorage on init
    if (isTokenValid()) return getStoredUser();
    clearAuth();
    return null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // ─── Chat state ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<SelectedPaper[]>([]);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ─── Auth handlers ────────────────────────────────────────────────────────

  const handleLogin = async (username: string, password: string) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const { token, user: userData } = await apiLogin(username, password);
      saveAuth(token, userData);
      setUser(userData);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Login gagal";
      if (msg.includes("Username atau password salah") || msg.includes("401")) {
        setLoginError("Username atau password salah");
      } else if (msg.includes("502") || msg.includes("unreachable")) {
        setLoginError("Layanan autentikasi IPB sedang bermasalah, coba lagi nanti");
      } else {
        setLoginError(msg);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
    setCurrentMessages([]);
    setSelectedPapers([]);
    setFilters(EMPTY_FILTERS);
  };

  // ─── Session helpers ──────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    setIsSessionsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat sesi.";
      // Token expired / invalid → force logout
      if (message.includes("401") || message.includes("403") || message.includes("tidak valid")) {
        handleLogout();
        return;
      }
      setSessions([]);
    } finally {
      setIsSessionsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  // ─── Chat handlers ────────────────────────────────────────────────────────

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setCurrentMessages([]);
    setSelectedPapers([]);
    setFilters(EMPTY_FILTERS);
  };

  const handleSelectSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setSelectedPapers([]);
    setIsSessionLoading(true);
    try {
      const data = await getSessionDetail(sessionId);
      setCurrentMessages(
        data.messages.map((message) => ({
          ...message,
          id: String(message.id),
        }))
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat chat.";
      if (message.includes("401") || message.includes("403")) {
        handleLogout();
        return;
      }
      toast.error(`Gagal load session: ${message}`);
      setCurrentSessionId(null);
      setCurrentMessages([]);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleTogglePaper = (paperId: string, title: string) => {
    setSelectedPapers((prev) => {
      const exists = prev.some((paper) => paper.id === paperId);
      if (exists) return prev.filter((paper) => paper.id !== paperId);
      return [...prev, { id: paperId, title }];
    });
  };

  const handleRemovePaper = (paperId: string) => {
    setSelectedPapers((prev) => prev.filter((paper) => paper.id !== paperId));
  };

  const handleSendMessage = async (query: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };

    setCurrentMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const payload: {
        query: string;
        session_id: number | null;
        selected_paper_ids?: string[];
        faculty?: string;
        department?: string;
        document_type?: string;
        year?: number;
        year_range?: { start: number; end: number };
      } = {
        query,
        session_id: currentSessionId,
      };

      if (selectedPapers.length > 0) {
        payload.selected_paper_ids = selectedPapers.map((paper) => paper.id);
      }

      if (filters.faculty) payload.faculty = filters.faculty;
      if (filters.department) payload.department = filters.department;
      if (filters.document_type) payload.document_type = filters.document_type;
      if (filters.year) payload.year = filters.year;
      if (filters.year_range.start || filters.year_range.end) {
        payload.year_range = {
          start: filters.year_range.start ?? 0,
          end: filters.year_range.end ?? new Date().getFullYear(),
        };
      }

      // Add a streaming placeholder message immediately
      const tempAssistantId = `assistant-temp-${Date.now()}`;
      const initialAssistantMessage: Message = {
        id: tempAssistantId,
        role: "assistant",
        progress_text: "Memproses...", 
        content: "",
        created_at: new Date().toISOString(),
        references: [],
      };

      setCurrentMessages((prev) => [...prev, initialAssistantMessage]);

      // 2. Use fetch directly to access the stream
      const token = getToken();
      const response = await fetch(`${BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      if (!response.body) {
        throw new Error("No readable stream available.");
      }

      // 3. Setup the stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      // 4. Read the stream continuously
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the bytes into text and add to our buffer
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines. The last element might be an incomplete line, so we keep it in the buffer.
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          console.log(`Processing line: ${line}`);

          // SSE data lines start with "data: "
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            const event = JSON.parse(dataStr);
            console.log(`Received event: ${event.type}`, event);

            if (event.type === 'progress') {
              // Update your progress state
              setCurrentMessages(prev => prev.map(msg =>
                  msg.id === tempAssistantId ? {...msg, progress_text: event.message} : msg
              ));
              
            } else if (event.type === 'token') {
              // Append the new token and update the specific message in state
              accumulatedContent += event.content;
              setCurrentMessages(prev => prev.map(msg =>
                  msg.id === tempAssistantId ? {...msg, content: accumulatedContent, progress_text: null} : msg
              ));

            } else if (event.type === 'references') {

              setCurrentMessages(prev => prev.map(msg =>
                  msg.id === tempAssistantId ? {...msg, references: event.references} : msg
              ));
            } else if (event.type === 'error') {
              // Backend sent an explicit error mid-stream
              throw new Error(event.message);
              
            } else if (event.type === 'done') {
              if (event.session_id) {
                setCurrentSessionId(event.session_id);
                await loadSessions();
              }
              
              setSelectedPapers([]);
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengirim pesan.";
      if (message.includes("401") || message.includes("403")) {
        handleLogout();
        return;
      }
      toast.error(message, { duration: 60000 });
    } finally {
      setIsSending(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          isLoading={isLoginLoading}
          error={loginError}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {isSidebarOpen && (
        <Sidebar
          user={user}
          sessions={sessions}
          currentSessionId={currentSessionId}
          isLoading={isSessionsLoading}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />
      )}
      <ChatArea
        messages={currentMessages}
        selectedPapers={selectedPapers}
        isSending={isSending}
        isLoadingSession={isSessionLoading}
        filters={filters}
        isSidebarOpen={isSidebarOpen}
        onTogglePaper={handleTogglePaper}
        onSendMessage={handleSendMessage}
        onRemovePaper={handleRemovePaper}
        onFiltersChange={setFilters}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
}

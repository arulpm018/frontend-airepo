import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import type { Message, SelectedPaper, Session, ActiveFilters } from "@/lib/types";
import { getSessionDetail, getSessions, sendMessage } from "@/lib/api";

const DEFAULT_USER_ID =
  import.meta.env.VITE_USER_ID?.trim() ?? "hasrulmalik";

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
  const [userId] = useState(DEFAULT_USER_ID);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<SelectedPaper[]>([]);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const loadSessions = useCallback(async () => {
    console.log("[App] loadSessions START - userId:", userId);
    setIsSessionsLoading(true);
    try {
      console.log("[App] Calling getSessions API...");
      const data = await getSessions(userId, 50);
      console.log("[App] ✅ getSessions returned:", data);
      console.log("[App] ✅ Sessions count:", data.length);
      console.log("[App] ✅ Calling setSessions with data:", data);
      setSessions(data);
      console.log("[App] ✅ setSessions called successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat sesi.";
      console.error("[App] ❌ loadSessions ERROR:", message, error);
      // Silent error - only log to console, no toast
      // Set empty array so UI shows "no sessions"
      console.log("[App] Setting sessions to empty array due to error");
      setSessions([]);
    } finally {
      console.log("[App] Setting isSessionsLoading to false");
      setIsSessionsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log("[App] Component mounted - testing loadSessions");
    // Test if backend CORS is fixed
    loadSessions();
  }, [loadSessions]);

  // Debug: Log sessions state changes
  useEffect(() => {
    console.log("[App] 🔄 SESSIONS STATE UPDATED:", {
      count: sessions.length,
      sessions: sessions,
    });
  }, [sessions]);

  const handleNewChat = () => {
    console.log("[Chat] New Chat button clicked - resetting session");
    setCurrentSessionId(null); // Reset to null so next message creates new session
    setCurrentMessages([]);
    setSelectedPapers([]);
    setFilters(EMPTY_FILTERS); // Reset filters on new chat
  };

  const handleSelectSession = async (sessionId: number) => {
    console.log("[Chat] Loading existing session:", sessionId);
    setCurrentSessionId(sessionId); // Set session_id so messages continue this session
    setSelectedPapers([]);
    setIsSessionLoading(true);
    try {
      const data = await getSessionDetail(userId, sessionId);
      console.log("[Chat] Session loaded:", {
        session_id: data.id,
        title: data.title,
        messages_count: data.messages.length,
      });
      setCurrentMessages(
        data.messages.map((message) => ({
          ...message,
          id: String(message.id),
        }))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat chat.";
      console.error("[Chat] Failed to load session:", sessionId, error);

      // Check if it's a backend error
      if (message.includes("500") || message.includes("Internal")) {
        toast.error(`Backend error saat load session ${sessionId}. Coba session lain.`);
      } else {
        toast.error(`Gagal load session: ${message}`);
      }

      // Reset to new chat on error
      setCurrentSessionId(null);
      setCurrentMessages([]);
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleTogglePaper = (paperId: string, title: string) => {
    setSelectedPapers((prev) => {
      const exists = prev.some((paper) => paper.id === paperId);
      if (exists) {
        return prev.filter((paper) => paper.id !== paperId);
      }
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
      // Log session state
      if (currentSessionId === null) {
        console.log("[Chat] Starting NEW chat session");
      } else {
        console.log("[Chat] Continuing existing session:", currentSessionId);
      }

      // Build payload with filters
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

      // Add selected papers if any
      if (selectedPapers.length > 0) {
        payload.selected_paper_ids = selectedPapers.map((paper) => paper.id);
      }

      // Add filters if set
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

      console.log("[Chat] Sending message with payload:", payload);

      const response = await sendMessage(userId, payload);

      console.log("[Chat] Response received:", {
        session_id: response.session_id,
        message_id: response.message_id,
        references_count: response.references?.length ?? 0,
      });

      // Only update session_id if this was a new chat (currentSessionId was null)
      if (currentSessionId === null) {
        console.log("[Chat] New session created with ID:", response.session_id);
        setCurrentSessionId(response.session_id);
        await loadSessions(); // Refresh sidebar to show new session
      }

      const assistantMessage: Message = {
        id: `assistant-${response.message_id}`,
        role: "assistant",
        content: response.ai_response,
        created_at: new Date().toISOString(),
        references: response.references ?? [],
      };

      setCurrentMessages((prev) => [...prev, assistantMessage]);
      setSelectedPapers([]); // Clear selected papers after send
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim pesan.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {isSidebarOpen && (
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          isLoading={isSessionsLoading}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
      <ChatArea
        userId={userId}
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
        onToggleSidebar={handleToggleSidebar}
      />
      <Toaster position="top-right" richColors />
    </div>
  );
}


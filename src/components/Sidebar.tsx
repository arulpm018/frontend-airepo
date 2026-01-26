import { useEffect } from "react";
import { Plus, PanelLeft } from "lucide-react";
import type { Session } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SidebarProps = {
  sessions: Session[];
  currentSessionId: number | null;
  isLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (sessionId: number) => void;
  onToggleSidebar: () => void;
};

export default function Sidebar({
  sessions,
  currentSessionId,
  isLoading,
  onNewChat,
  onSelectSession,
  onToggleSidebar,
}: SidebarProps) {
  // Debug: Log sessions state changes
  useEffect(() => {
    console.log("[Sidebar] State updated:", {
      isLoading,
      sessionsCount: sessions.length,
      sessions: sessions.slice(0, 3), // Log first 3 sessions
    });
  }, [sessions, isLoading]);
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300">
      {/* Header - fixed */}
      <div className="shrink-0 border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">AI Repository IPB</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            title="Close sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pb-3">
          <Button className="w-full" onClick={onNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Sessions list - scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {isLoading ? (
          <div className="space-y-3 px-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="mx-2 rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
            <div className="mb-2 text-slate-600">💬</div>
            <p className="mb-1 font-medium">Belum ada sesi</p>
            <p>Mulai chat baru untuk membuat sesi.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => {
              const isActive = currentSessionId === session.id;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-soft"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="truncate font-medium">
                      {session.title || "Untitled chat"}
                    </div>
                    <div
                      className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"
                        }`}
                    >
                      {formatTimestamp(session.updated_at)}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}


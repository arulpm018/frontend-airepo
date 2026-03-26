import { useEffect, useRef, useState } from "react";
import type { Message as MessageType, SelectedPaper, ActiveFilters } from "@/lib/types";
import Message from "@/components/Message";
import InputBox from "@/components/InputBox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Wifi, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatAreaProps = {
  messages: MessageType[];
  selectedPapers: SelectedPaper[];
  isSending: boolean;
  isLoadingSession: boolean;
  filters: ActiveFilters;
  isSidebarOpen: boolean;
  onTogglePaper: (paperId: string, title: string) => void;
  onSendMessage: (message: string) => void;
  onRemovePaper: (paperId: string) => void;
  onFiltersChange: (filters: ActiveFilters) => void;
  onToggleSidebar: () => void;
};

export default function ChatArea({
  messages,
  selectedPapers,
  isSending,
  isLoadingSession,
  filters,
  isSidebarOpen,
  onTogglePaper,
  onSendMessage,
  onRemovePaper,
  onFiltersChange,
  onToggleSidebar,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantMessageRef = useRef<HTMLDivElement | null>(null);
  const [prevMessagesCount, setPrevMessagesCount] = useState(0);

  useEffect(() => {
    if (isLoadingSession) return;

    const messageCountDiff = messages.length - prevMessagesCount;

    if (messageCountDiff > 2 && lastUserMessageRef.current) {
      setTimeout(() => {
        lastUserMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else if (messages.length > prevMessagesCount) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant" && lastAssistantMessageRef.current) {
        setTimeout(() => {
          lastAssistantMessageRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }

    setPrevMessagesCount(messages.length);
  }, [messages, isLoadingSession, prevMessagesCount]);

  return (
    <section className="flex flex-1 flex-col relative h-screen transition-all duration-300">
      {/* Toggle sidebar button (when sidebar is closed) */}
      {!isSidebarOpen && (
        <div className="absolute top-4 left-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            title="Open sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Scrollable messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pb-6 pt-6 md:px-8"
      >
        {isLoadingSession ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-2/3" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-900">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Mulai Pencarian
                </h3>
                <p className="text-slate-500">
                  Mulai percakapan dengan menanyakan topik penelitian yang kamu butuhkan.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
                <div className="flex gap-3">
                  <div className="shrink-0">
                    <Wifi className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="font-medium text-blue-700">Koneksi Diperlukan</p>
                    <p className="text-blue-600/90 leading-relaxed">
                      Untuk dapat menggunakan fitur chat, pastikan perangkat kamu terkoneksi dengan wifi kampus{" "}
                      <span className="font-semibold">ipb-access</span> atau menggunakan{" "}
                      <span className="font-semibold">OpenVPN IPB</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              const lastUserMessageIndex = messages.map((m) => m.role).lastIndexOf("user");
              const isLastUserMessage =
                message.role === "user" && index === lastUserMessageIndex;

              const lastAssistantMessageIndex = messages
                .map((m) => m.role)
                .lastIndexOf("assistant");
              const isLastAssistantMessage =
                message.role === "assistant" && index === lastAssistantMessageIndex;

              return (
                <div
                  key={message.id}
                  ref={
                    isLastUserMessage
                      ? lastUserMessageRef
                      : isLastAssistantMessage
                      ? lastAssistantMessageRef
                      : null
                  }
                >
                  <Message
                    message={message}
                    selectedPaperIds={selectedPapers.map((paper) => paper.id)}
                    onTogglePaper={onTogglePaper}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed input box at bottom */}
      <div className="shrink-0">
        <InputBox
          selectedPapers={selectedPapers}
          isSending={isSending}
          filters={filters}
          onSendMessage={onSendMessage}
          onRemovePaper={onRemovePaper}
          onFiltersChange={onFiltersChange}
        />
      </div>
    </section>
  );
}

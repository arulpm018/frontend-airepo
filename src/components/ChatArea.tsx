import { useEffect, useRef, useState } from "react";
import type { Message as MessageType, SelectedPaper, ActiveFilters } from "@/lib/types";
import Message from "@/components/Message";
import InputBox from "@/components/InputBox";
import { Skeleton } from "@/components/ui/skeleton";

type ChatAreaProps = {
  userId: string;
  messages: MessageType[];
  selectedPapers: SelectedPaper[];
  isSending: boolean;
  isLoadingSession: boolean;
  filters: ActiveFilters;
  onTogglePaper: (paperId: string, title: string) => void;
  onSendMessage: (message: string) => void;
  onRemovePaper: (paperId: string) => void;
  onFiltersChange: (filters: ActiveFilters) => void;
};

export default function ChatArea({
  userId,
  messages,
  selectedPapers,
  isSending,
  isLoadingSession,
  filters,
  onTogglePaper,
  onSendMessage,
  onRemovePaper,
  onFiltersChange,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantMessageRef = useRef<HTMLDivElement | null>(null);
  const [prevMessagesCount, setPrevMessagesCount] = useState(0);

  // Scroll behavior: 
  // - When loading session (many messages added) → scroll to last user message
  // - When sending new message → scroll to last assistant message (top of AI response)
  useEffect(() => {
    if (isLoadingSession) return; // Don't scroll while loading

    const messageCountDiff = messages.length - prevMessagesCount;
    
    // If messages increased by more than 2, it's a session load
    // Scroll to last user message so user sees their question + AI response
    if (messageCountDiff > 2 && lastUserMessageRef.current) {
      setTimeout(() => {
        lastUserMessageRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "start" // Align to top of viewport
        });
      }, 100);
    } else if (messages.length > prevMessagesCount) {
      // New message(s) added - check if last message is from assistant
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant" && lastAssistantMessageRef.current) {
        // Scroll to top of assistant message, not bottom
        setTimeout(() => {
          lastAssistantMessageRef.current?.scrollIntoView({ 
            behavior: "smooth",
            block: "start" // Align to top of viewport
          });
        }, 100);
      }
    }

    setPrevMessagesCount(messages.length);
  }, [messages, isLoadingSession, prevMessagesCount]);

  return (
    <section className="flex flex-1 flex-col relative h-screen">
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
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
            <div className="max-w-sm rounded-lg border border-dashed border-slate-200 bg-white px-6 py-6 shadow-soft">
              Mulai percakapan dengan menanyakan topik penelitian yang kamu
              butuhkan.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              // Find last user message for scroll target
              const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf("user");
              const isLastUserMessage = 
                message.role === "user" && 
                index === lastUserMessageIndex;
              
              // Find last assistant message for scroll target
              const lastAssistantMessageIndex = messages.map(m => m.role).lastIndexOf("assistant");
              const isLastAssistantMessage = 
                message.role === "assistant" && 
                index === lastAssistantMessageIndex;
              
              return (
                <div 
                  key={message.id}
                  ref={isLastUserMessage ? lastUserMessageRef : (isLastAssistantMessage ? lastAssistantMessageRef : null)}
                >
                  <Message
                    message={message}
                    selectedPaperIds={selectedPapers.map((paper) => paper.id)}
                    onTogglePaper={onTogglePaper}
                  />
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  AI
                </div>
                <div className="max-w-xl rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-soft">
                  Mengetik jawaban...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed input box at bottom */}
      <div className="shrink-0">
        <InputBox
          userId={userId}
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


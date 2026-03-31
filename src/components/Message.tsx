import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, ThumbsUp, ThumbsDown, Send, ChevronDown, ChevronRight } from "lucide-react";
import type { Message as MessageType } from "@/lib/types";
import { submitFeedback } from "@/lib/api";
import { toast } from "sonner";
import ReferenceCard from "@/components/ReferenceCard";


type MessageProps = {
  message: MessageType;
  selectedPaperIds: string[];
  onTogglePaper: (paperId: string, title: string) => void;
};

// Component to render text with clickable citations
function TextWithCitations({ children, messageId }: { children: string; messageId: string }) {
  // Split text by citation pattern [1], [2], etc.
  const parts = children.split(/(\[\d+\])/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a citation
        const citationMatch = part.match(/\[(\d+)\]/);
        if (citationMatch) {
          const citationNumber = citationMatch[1];
          return (
            <button
              key={index}
              onClick={() => {
                const element = document.getElementById(`reference-${messageId}-${citationNumber}`);
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
                // Add a highlight effect
                element?.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
                setTimeout(() => {
                  element?.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
                }, 2000);
              }}
              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium cursor-pointer hover:underline transition-colors"
              aria-label={`Lihat referensi ${citationNumber}`}
            >
              {part}
            </button>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Helper to process children and replace citations
function processChildren(children: React.ReactNode, messageId: string): React.ReactNode {
  if (typeof children === 'string') {
    return <TextWithCitations messageId={messageId}>{children}</TextWithCitations>;
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        return <TextWithCitations key={index} messageId={messageId}>{child}</TextWithCitations>;
      }
      return child;
    });
  }

  return children;
}

export default function Message({
  message,
  selectedPaperIds,
  onTogglePaper,
}: MessageProps) {
  const isUser = message.role === "user";
  
  const [feedbackStatus, setFeedbackStatus] = useState<"up" | "down" | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);

  const messageIdInt = parseInt(message.id, 10);
  const isCompleteAiMessage = !isUser && !isNaN(messageIdInt) && !message.progress_text;

  const handleFeedback = async (type: "up" | "down") => {
    if (!isCompleteAiMessage) return;
    
    // Toggle logic: if clicking the same one, maybe we shouldn't untoggle since the DB is an upsert,
    // but we can just update status and show UI. The specification doesn't mention untoggling.
    if (type === "up") {
      setFeedbackStatus("up");
      setShowFeedbackForm(false);
      await sendFeedbackToApi(true, "");
    } else {
      setFeedbackStatus("down");
      setShowFeedbackForm(true);
      // Wait for user to type feedback_text and submit
    }
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackStatus !== "down") return;
    setIsSubmitting(true);
    await sendFeedbackToApi(false, feedbackText);
    setIsSubmitting(false);
    setShowFeedbackForm(false);
  };

  const sendFeedbackToApi = async (isLiked: boolean, text: string) => {
    try {
      await submitFeedback({
        message_id: messageIdInt,
        is_liked: isLiked,
        feedback_text: text || undefined,
      });
      toast.success("Feedback berhasil dikirim");
    } catch (error) {
      toast.error("Gagal mengirim feedback");
      console.error(error);
    }
  };


  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex w-full max-w-3xl gap-2 md:gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <div className={`h-6 w-6 md:h-8 md:w-8 shrink-0 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold mt-0.5 ${message.isError ? "bg-amber-100 text-amber-700" : "bg-slate-900 text-white"}`}>
            AI
          </div>
        )}
        <div className="space-y-2 md:space-y-3 max-w-[85%] md:max-w-none">
          <div
            className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 text-[13.5px] md:text-sm shadow-soft ${
              isUser
                ? "bg-slate-900 text-white"
                : message.isError
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "bg-white text-slate-800"
            }`}
          >
            {message.isError ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{message.content}</span>
              </div>
            ) : (
              <>
                <div>
                  <small className="animate-pulse text-gray-500">{message.progress_text}</small>
                </div>
                {isUser ? (
                  message.content
                ) : (
                  <ReactMarkdown
                    className="prose prose-sm prose-slate max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-ol:list-decimal prose-ul:list-disc prose-li:my-1"
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">
                          {processChildren(children, message.id)}
                        </p>
                      ),
                      ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                      li: ({ children }) => (
                        <li className="leading-relaxed">
                          {processChildren(children, message.id)}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">
                          {processChildren(children, message.id)}
                        </strong>
                      ),
                      h1: ({ children }) => <h1 className="mb-2 text-lg font-semibold">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-2 text-base font-semibold">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold">{children}</h3>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </>
            )}
          </div>

          {isCompleteAiMessage && !message.isError && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1 pt-0.5 sm:px-2">
                <button
                  onClick={() => handleFeedback("up")}
                  className={`flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-full transition-colors ${
                    feedbackStatus === "up"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  }`}
                  title="Jawaban Akurat"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleFeedback("down")}
                  className={`flex h-9 w-9 md:h-8 md:w-8 items-center justify-center rounded-full transition-colors ${
                    feedbackStatus === "down"
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  }`}
                  title="Jawaban Tidak Akurat"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>

              {showFeedbackForm && feedbackStatus === "down" && (
                <div className="mt-2 text-sm max-w-sm rounded-xl border border-slate-200 bg-white p-3 shadow-soft space-y-2">
                  <p className="font-medium text-slate-700">Kenapa jawaban ini kurang tepat?</p>
                  <textarea
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    placeholder="Masukkan alasan (opsional)..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        "Mengirim..."
                      ) : (
                        <>
                          Kirim <Send className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isUser && message.references && message.references.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden mt-1 md:mt-0">
              <button
                onClick={() => setIsReferencesOpen(!isReferencesOpen)}
                className="w-full flex items-center justify-between p-3 md:p-4 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={isReferencesOpen}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  References ({message.references.length})
                </div>
                {isReferencesOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {isReferencesOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
                  {message.references.map((reference, index) => (
                    <ReferenceCard
                      key={`${reference.paper_id}-${index}`}
                      reference={reference}
                      referenceNumber={index + 1}
                      isSelected={selectedPaperIds.includes(reference.paper_id)}
                      onToggle={onTogglePaper}
                      showDivider={index !== message.references!.length - 1}
                      messageId={message.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {isUser && (
          <div className="h-6 w-6 md:h-8 md:w-8 shrink-0 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] md:text-xs font-semibold mt-0.5">
            You
          </div>
        )}
      </div>
    </div>
  );
}


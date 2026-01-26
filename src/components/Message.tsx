import ReactMarkdown from "react-markdown";
import type { Message as MessageType } from "@/lib/types";
import ReferenceCard from "@/components/ReferenceCard";
import type { Components } from "react-markdown";

type MessageProps = {
  message: MessageType;
  selectedPaperIds: string[];
  onTogglePaper: (paperId: string, title: string) => void;
};

// Component to render text with clickable citations
function TextWithCitations({ children }: { children: string }) {
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
                const element = document.getElementById(`reference-${citationNumber}`);
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
function processChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    return <TextWithCitations>{children}</TextWithCitations>;
  }
  
  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        return <TextWithCitations key={index}>{child}</TextWithCitations>;
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

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-3xl gap-3">
        {!isUser && (
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            AI
          </div>
        )}
        <div className="space-y-3">
          <div
            className={`rounded-2xl px-4 py-3 text-sm shadow-soft ${
              isUser
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-800"
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-slate max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-ol:list-decimal prose-ul:list-disc prose-li:my-1"
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0">
                      {processChildren(children)}
                    </p>
                  ),
                  ul: ({ children }) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {processChildren(children)}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">
                      {processChildren(children)}
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
          </div>

          {!isUser && message.references && message.references.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                References
              </div>
              <div className="mt-3 space-y-3">
                {message.references.map((reference, index) => (
                  <ReferenceCard
                    key={`${reference.paper_id}-${index}`}
                    reference={reference}
                    referenceNumber={index + 1}
                    isSelected={selectedPaperIds.includes(reference.paper_id)}
                    onToggle={onTogglePaper}
                    showDivider={index !== message.references!.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {isUser && (
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
            You
          </div>
        )}
      </div>
    </div>
  );
}


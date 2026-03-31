import { useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Reference } from "@/lib/types";
import { truncateText } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type ReferenceCardProps = {
  reference: Reference;
  referenceNumber: number;
  isSelected: boolean;
  onToggle: (paperId: string, title: string) => void;
  showDivider: boolean;
  messageId: string;
};

export default function ReferenceCard({
  reference,
  referenceNumber,
  isSelected,
  onToggle,
  showDivider,
  messageId,
}: ReferenceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        id={`reference-${messageId}-${referenceNumber}`}
        className={`rounded-xl border px-3 md:px-4 py-3 transition scroll-mt-4 overflow-hidden ${isSelected
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 bg-white"
          }`}
      >
        <div className="flex items-start gap-2 md:gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 text-xs font-bold text-blue-600 w-6">
              [{referenceNumber}]
            </span>
            <Checkbox
              checked={isSelected}
              aria-label={`Pilih referensi ${reference.title}`}
              onChange={() => onToggle(reference.paper_id, reference.title)}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="font-semibold text-slate-900 break-words">
              {reference.title}
            </div>
            <div className="truncate text-xs text-slate-500">
              {[reference.authors, reference.year, reference.type]
                .filter(Boolean)
                .join(" • ")}
            </div>
            {reference.faculty || reference.department ? (
              <div className="text-xs text-slate-400">
                {[reference.faculty, reference.department]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            ) : null}
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-xs text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-900 break-all"
            >
              {truncateText(reference.url, 60)}
              <ExternalLink className="h-3 w-3" />
            </a>
            <div
              className={`animate-expand text-xs text-slate-600 break-words ${expanded
                  ? "max-h-[2000px] opacity-100 transition-all duration-500 ease-in-out"
                  : "line-clamp-3 max-h-20 opacity-90 transition-all duration-300 ease-in-out"
                } overflow-hidden`}
            >
              {reference.abstract}
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Read less" : "Read more"}
            </button>
          </div>
        </div>
      </div>
      {showDivider && <Separator className="my-3" />}
    </div>
  );
}


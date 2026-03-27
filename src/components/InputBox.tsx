import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import type { SelectedPaper, ActiveFilters, ChatLimit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SelectedPaperChip from "@/components/SelectedPaperChip";
import FilterDialog from "@/components/FilterDialog";

type InputBoxProps = {
  selectedPapers: SelectedPaper[];
  isSending: boolean;
  filters: ActiveFilters;
  chatLimit: ChatLimit | null;
  onSendMessage: (message: string) => void;
  onRemovePaper: (paperId: string) => void;
  onFiltersChange: (filters: ActiveFilters) => void;
};

export default function InputBox({
  selectedPapers,
  isSending,
  filters,
  chatLimit,
  onSendMessage,
  onRemovePaper,
  onFiltersChange,
}: InputBoxProps) {
  const [message, setMessage] = useState("");

  const isLimitExceeded = chatLimit !== null && chatLimit.remaining_chats === 0;

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setMessage("");
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-4 md:px-8">
      {selectedPapers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedPapers.map((paper) => (
            <SelectedPaperChip
              key={paper.id}
              title={paper.title}
              onRemove={() => onRemovePaper(paper.id)}
            />
          ))}
        </div>
      )}

      {isLimitExceeded && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Kuota chat harian ({chatLimit.daily_limit} chat/hari) sudah habis.
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            placeholder="Tulis pertanyaanmu di sini..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
            disabled={isSending}
            className="resize-none"
          />
        </div>
        <div className="flex gap-2">
          <FilterDialog
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSending || message.trim().length === 0}
            className="h-10 px-4"
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            Kirim
          </Button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Enter untuk kirim, Shift + Enter untuk baris baru.
        </span>
        {chatLimit !== null && (
          <span
            className={`text-xs font-medium ${
              chatLimit.remaining_chats === 0
                ? "text-red-600"
                : chatLimit.remaining_chats <= 3
                ? "text-amber-600"
                : "text-slate-500"
            }`}
          >
            {chatLimit.remaining_chats} / {chatLimit.daily_limit} chat tersisa hari ini
          </span>
        )}
      </div>
    </div>
  );
}

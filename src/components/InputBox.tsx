import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import type { SelectedPaper, ActiveFilters } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SelectedPaperChip from "@/components/SelectedPaperChip";
import FilterDialog from "@/components/FilterDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Target, Brain } from "lucide-react";

type InputBoxProps = {
  userId: string;
  selectedPapers: SelectedPaper[];
  isSending: boolean;
  filters: ActiveFilters;
  searchMode: "fast" | "accurate";
  embeddingModel: "openai" | "selfhosted";
  onSendMessage: (message: string) => void;
  onRemovePaper: (paperId: string) => void;
  onFiltersChange: (filters: ActiveFilters) => void;
  onSearchModeChange: (mode: "fast" | "accurate") => void;
  onEmbeddingModelChange: (model: "openai" | "selfhosted") => void;
};

export default function InputBox({
  userId,
  selectedPapers,
  isSending,
  filters,
  searchMode,
  embeddingModel,
  onSendMessage,
  onRemovePaper,
  onFiltersChange,
  onSearchModeChange,
  onEmbeddingModelChange,
}: InputBoxProps) {
  const [message, setMessage] = useState("");

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
          <Select value={searchMode} onValueChange={(val) => onSearchModeChange(val as "fast" | "accurate")}>
            <SelectTrigger className="h-10 w-[110px] px-2 lg:px-3">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fast">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  <span>Fast</span>
                </div>
              </SelectItem>
              <SelectItem value="accurate">
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-blue-500" />
                  <span>Accurate</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={embeddingModel} onValueChange={(val) => onEmbeddingModelChange(val as "openai" | "selfhosted")}>
            <SelectTrigger className="h-10 w-[130px] px-2 lg:px-3">
              <SelectValue placeholder="Embedding" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="selfhosted">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-purple-500" />
                  <span>Selfhosted</span>
                </div>
              </SelectItem>
              <SelectItem value="openai">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-green-500" />
                  <span>OpenAI</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FilterDialog
            userId={userId}
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
      <div className="mt-2 text-xs text-slate-500">
        Enter untuk kirim, Shift + Enter untuk baris baru.
      </div>
    </div>
  );
}


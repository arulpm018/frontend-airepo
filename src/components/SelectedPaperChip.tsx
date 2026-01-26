import { X } from "lucide-react";
import { truncateText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SelectedPaperChipProps = {
  title: string;
  onRemove: () => void;
};

export default function SelectedPaperChip({
  title,
  onRemove,
}: SelectedPaperChipProps) {
  return (
    <Badge className="flex items-center gap-1 bg-slate-900 text-white">
      {truncateText(title, 30)}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full text-white hover:bg-white/10"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}


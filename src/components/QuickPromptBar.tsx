import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, ChevronDown, X } from "lucide-react";
import { QuickPrompts } from "./QuickPrompts";

interface QuickPromptBarProps {
  onPromptSelect: (prompt: string) => void;
  currentText: string;
  onClear: () => void;
}

const featuredPrompts = [
  { id: "1", text: "Write a blog post about remote work" },
  { id: "2", text: "Email a client about project updates" },
  { id: "3", text: "Product description for smart watch" },
  { id: "4", text: "Social media post for feature launch" },
  { id: "5", text: "Cover letter for software developer" },
  { id: "6", text: "Marketing copy for a mobile app" },
];

export const QuickPromptBar = ({
  onPromptSelect,
  currentText,
  onClear,
}: QuickPromptBarProps) => {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Quick prompts
          </span>
        </div>
        <div className="flex items-center gap-2">
          {currentText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 text-xs gap-1 px-2 rounded-md"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {featuredPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptSelect(prompt.text)}
            className="shrink-0 px-3 py-1.5 text-xs font-medium bg-card border rounded-lg hover:bg-primary/5 hover:border-primary/20 transition-colors text-left whitespace-nowrap"
          >
            {prompt.text}
          </button>
        ))}

        <Dialog open={showAll} onOpenChange={setShowAll}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 text-xs gap-1 rounded-lg px-3"
            >
              <ChevronDown className="h-3 w-3" />
              Browse all
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-medium">
                <Sparkles className="h-5 w-5 text-primary" />
                All prompts
              </DialogTitle>
            </DialogHeader>
            <QuickPrompts
              onPromptSelect={(text) => {
                onPromptSelect(text);
                setShowAll(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

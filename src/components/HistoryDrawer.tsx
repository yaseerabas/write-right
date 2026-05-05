import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  History,
  Search,
  Trash2,
  Download,
  Clock,
  X,
  FileText,
} from "lucide-react";
import {
  useGenerationHistory,
  HistoryEntry,
} from "@/hooks/useGenerationHistory";
import { showSuccess } from "@/utils/toast";

interface HistoryDrawerProps {
  onRestoreEntry: (entry: HistoryEntry) => void;
}

export const HistoryDrawer = ({ onRestoreEntry }: HistoryDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    filteredHistory,
    searchQuery,
    setSearchQuery,
    removeEntry,
    clearHistory,
    exportHistory,
    entryCount,
  } = useGenerationHistory();

  const handleRestore = (entry: HistoryEntry) => {
    onRestoreEntry(entry);
    setIsOpen(false);
    showSuccess("History entry restored");
  };

  const handleClear = () => {
    clearHistory();
    showSuccess("History cleared");
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getToolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      generate: "Generate",
      edit: "Edit",
      summarize: "Summarize",
      rewrite: "Rewrite",
      simplify: "Simplify",
      bullet: "Bullet Points",
      keywords: "Keywords",
      cta: "CTA",
      ideas: "Ideas",
      social: "Social Media",
    };
    return labels[tool] || tool;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg relative transition-colors duration-200"
        >
          <History className="h-4 w-4 text-muted-foreground" />
          {entryCount > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] absolute -top-1 -right-1"
            >
              {entryCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-medium">
            <History className="h-5 w-5 text-muted-foreground" />
            Generation history
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportHistory}
              disabled={entryCount === 0}
              className="flex-1 gap-2 rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={entryCount === 0}
                  className="flex-1 gap-2 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5 transition-all duration-200 active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes all {entryCount} history entries.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClear}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* History List */}
          <ScrollArea className="flex-1 w-full custom-scrollbar">
            <div className="space-y-3 pr-2">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No history entries yet</p>
                  <p className="text-xs mt-1">Generated text will appear here</p>
                </div>
              ) : (
                filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="group p-3 rounded-xl border bg-card hover:bg-muted/60 transition-colors cursor-pointer"
                    onClick={() => handleRestore(entry)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {getToolLabel(entry.toolUsed)}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                            <Clock className="h-3 w-3" />
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {entry.input.slice(0, 60)}
                          {entry.input.length > 60 ? "..." : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                          {entry.output.slice(0, 120)}
                          {entry.output.length > 120 ? "..." : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEntry(entry.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

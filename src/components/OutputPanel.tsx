import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  RefreshCw,
  Share2,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { EmptyState } from "./EmptyState";

interface OutputPanelProps {
  outputText: string;
  isLoading: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onRewrite: () => void;
  onShare?: () => void;
  wordCount?: number;
  readingTime?: number;
}

export const OutputPanel = ({
  outputText,
  isLoading,
  onCopy,
  onDownload,
  onRewrite,
  onShare,
  wordCount,
  readingTime,
}: OutputPanelProps) => {
  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Generated Text",
          text: outputText,
        });
        showSuccess("Text shared");
      } catch (error) {
        showError("Failed to share text");
      }
    } else {
      // Fallback to copying to clipboard
      onCopy();
    }
  };

  const stats = [
    {
      label: "Words",
      value:
        wordCount ||
        outputText.split(/\s+/).filter((word) => word.length > 0).length,
    },
    { label: "Chars", value: outputText.length },
    {
      label: "Read",
      value: `${readingTime || Math.ceil(outputText.split(/\s+/).filter((word) => word.length > 0).length / 200)} min`,
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-medium">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Generated text
          </CardTitle>
          <div className="flex gap-0.5 sm:gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleShare}
              disabled={!outputText || isLoading}
              className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-primary/10 active:scale-95"
              title="Share"
              aria-label="Share output"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCopy}
              disabled={!outputText || isLoading}
              className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-primary/10 active:scale-95"
              title="Copy (Ctrl+Shift+C)"
              aria-label="Copy output to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDownload}
              disabled={!outputText || isLoading}
              className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-primary/10 active:scale-95"
              title="Download"
              aria-label="Download output as text file"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onRewrite}
              disabled={!outputText || isLoading}
              className="h-8 w-8 rounded-lg transition-all duration-200 hover:bg-primary/10 active:scale-95"
              title="Rewrite"
              aria-label="Use output as new input"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {outputText && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.map((stat, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs tabular-nums"
              >
                {stat.label}: {stat.value}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "min-h-[120px] sm:min-h-[150px] max-h-[40vh] sm:max-h-[50vh] overflow-y-auto custom-scrollbar rounded-xl border p-3 sm:p-4 transition-all duration-200",
            isLoading ? "bg-muted/50" : "bg-card",
            outputText && "border-border",
            !outputText &&
              !isLoading &&
              "border-dashed border-muted-foreground/20",
          )}
        >
          {isLoading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Generating...
                </span>
              </div>
              <div className="h-3 sm:h-4 bg-muted rounded-md w-3/4 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-muted rounded-md w-full animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-muted rounded-md w-5/6 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-muted rounded-md w-2/3 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-muted rounded-md w-4/5 animate-pulse"></div>
            </div>
          ) : outputText ? (
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm">
              {outputText}
            </p>
          ) : (
            <EmptyState
              icon={FileText}
              title="No output yet"
              description="Enter some text and click Generate to see results here"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

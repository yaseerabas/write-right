import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  text?: string;
  className?: string;
}

export const CharacterCounter = ({
  current,
  max,
  text,
  className,
}: CharacterCounterProps) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;
  const wordCount = text
    ? text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between text-xs tabular-nums",
        className,
      )}
    >
      <span
        className={cn(
          "transition-colors",
          isAtLimit
            ? "text-destructive"
            : isNearLimit
              ? "text-amber-600"
              : "text-muted-foreground",
        )}
      >
        {wordCount > 0 && <span className="mr-2">{wordCount} words</span>}
        {current} / {max} chars
      </span>
      {isNearLimit && (
        <span
          className={cn(
            "transition-colors font-medium",
            isAtLimit
              ? "text-destructive"
              : "text-amber-600",
          )}
        >
          {isAtLimit ? "Limit reached" : "Getting close to limit"}
        </span>
      )}
    </div>
  );
};

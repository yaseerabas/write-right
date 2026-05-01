import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 text-center",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary/50" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
        {description}
      </p>
      {action && (
        <Button
          variant="link"
          size="sm"
          onClick={action.onClick}
          className="mt-3 h-auto p-0 text-xs font-medium"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

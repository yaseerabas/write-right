import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const ToolCard = ({
  id,
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  isLoading = false,
}: ToolCardProps) => {
  return (
    <Card
      className={cn(
        "group p-3 sm:p-4 cursor-pointer transition-all duration-200 border hover:shadow-md",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-primary/30 hover:shadow-primary/5 active:scale-[0.98]",
        isLoading && "animate-pulse",
      )}
      onClick={() => !disabled && !isLoading && onClick()}
    >
      <CardContent className="p-0">
        <div
          className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2.5 sm:mb-3 transition-transform duration-200 bg-primary/10",
            !disabled && "group-hover:scale-105",
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-sm mb-0.5 sm:mb-1 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

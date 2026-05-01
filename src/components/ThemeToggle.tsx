import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  const Icon = icons[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg transition-colors duration-200"
      title={`Theme: ${labels[theme]} (click to cycle)`}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
};

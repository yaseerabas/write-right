import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Keyboard,
  Command,
  CornerDownLeft,
  Copy,
  X,
  HelpCircle,
} from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ["Ctrl", "Enter"], description: "Generate text" },
  { keys: ["Ctrl", "Shift", "C"], description: "Copy output" },
  { keys: ["Ctrl", "/"], description: "Show this help" },
  { keys: ["Escape"], description: "Close modals/drawers" },
];

export const KeyboardShortcutsHelp = () => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const formatKey = (key: string) => {
    if (key === "Ctrl" && isMac) return "⌘";
    if (key === "Ctrl") return "Ctrl";
    if (key === "Shift") return "⇧";
    if (key === "Enter") return "↵";
    return key;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1">
                    <kbd className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-muted border border-border rounded-md min-w-[1.5rem]">
                      {formatKey(key)}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-muted-foreground text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">
            ?
          </kbd>{" "}
          anytime to show this dialog.
        </p>
      </DialogContent>
    </Dialog>
  );
};

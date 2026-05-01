import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Settings,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Shield,
  Server,
  Key,
  Globe,
  Bot,
  ExternalLink,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { enhancedLLMService } from "@/services/enhancedLLMService";
import { isLLMConfigured, getDisplayConfig } from "@/config/llm.config";
import { clearAllSecureData } from "@/hooks/useSecureStorage";

const SettingsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "success" | "error"
  >("unknown");
  const config = getDisplayConfig();

  const handleTestConnection = async () => {
    if (!isLLMConfigured()) {
      showError("LLM is not configured. Set your environment variables.");
      return;
    }

    setIsValidating(true);
    setConnectionStatus("unknown");

    try {
      const isConnected = await enhancedLLMService.testConnection();
      if (isConnected) {
        setConnectionStatus("success");
        showSuccess("Connection verified");
      } else {
        setConnectionStatus("error");
        showError("Connection failed. Check your .env configuration.");
      }
    } catch (error) {
      setConnectionStatus("error");
      showError("Connection failed. Check your settings.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearAllData = () => {
    clearAllSecureData();
    showSuccess("All app data cleared");
    setIsOpen(false);
    window.location.reload();
  };

  const configured = isLLMConfigured();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg transition-colors duration-200"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-medium">
            <Shield className="h-5 w-5 text-primary" />
            LLM configuration
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Status */}
          <div
            className={`p-3 rounded-xl border ${
              configured
                ? "bg-primary/5 border-primary/20"
                : "bg-amber-500/5 border-amber-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {configured ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <p
                className={`text-sm font-medium ${
                  configured
                    ? "text-foreground"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {configured ? "LLM is configured" : "LLM is not configured"}
              </p>
            </div>
            {!configured && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Set{" "}
                <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                  VITE_LLM_API_KEY
                </code>{" "}
                in your{" "}
                <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                  .env
                </code>{" "}
                file, then restart the dev server.
              </p>
            )}
          </div>

          {/* Config Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              Current configuration
            </h3>

            <div className="space-y-2 text-sm">
              {[
                {
                  icon: Bot,
                  label: "Provider",
                  value: config.provider,
                  badge: true,
                },
                { icon: Server, label: "Model", value: config.modelId },
                {
                  icon: Key,
                  label: "API Key",
                  value: config.apiKeyMasked,
                  mono: true,
                },
                {
                  icon: Globe,
                  label: "Base URL",
                  value: config.baseUrl,
                  mono: true,
                  truncate: true,
                },
                {
                  icon: Globe,
                  label: "CORS Proxy",
                  value: config.corsProxyUrl,
                  mono: true,
                  truncate: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <Badge variant="secondary" className="text-xs">
                      {item.value}
                    </Badge>
                  ) : (
                    <span
                      className={`${item.mono ? "font-mono text-xs" : "font-medium"} ${item.truncate ? "truncate max-w-[180px]" : ""}`}
                    >
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Connection Test */}
          <div>
            <Button
              onClick={handleTestConnection}
              disabled={isValidating || !configured}
              className="w-full transition-all duration-200 active:scale-[0.98]"
              variant="outline"
            >
              {isValidating ? (
                <>Testing...</>
              ) : connectionStatus === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                  Connection verified
                </>
              ) : connectionStatus === "error" ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                  Retry connection test
                </>
              ) : (
                <>Test connection</>
              )}
            </Button>
          </div>

          {/* Documentation link */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-start gap-2.5">
              <ExternalLink className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">
                  How to configure
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Edit the{" "}
                  <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">
                    .env
                  </code>{" "}
                  file in the project root and restart the dev server. See{" "}
                  <code className="px-1 py-0.5 bg-background rounded text-[10px] font-mono">
                    .env.example
                  </code>{" "}
                  for all available options.
                </p>
              </div>
            </div>
          </div>

          {/* Clear all data section */}
          <div className="pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2 transition-all duration-200 active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes generation history, drafts, and
                    cached results. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;

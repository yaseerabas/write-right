import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  children?: React.ReactNode;
}

export const RetryButton = ({ onRetry, isRetrying = false, children }: RetryButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onRetry}
      disabled={isRetrying}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
      {children || (isRetrying ? 'Retrying...' : 'Try Again')}
    </Button>
  );
};
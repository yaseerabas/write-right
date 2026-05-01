import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PenTool, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center px-4 max-w-md mx-auto animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <PenTool className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-7xl font-bold tracking-tight text-foreground mb-3">
          404
        </h1>
        <p className="text-lg text-muted-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          The page at{" "}
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
            {location.pathname}
          </code>{" "}
          does not exist.
        </p>

        <Button asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to the workspace
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

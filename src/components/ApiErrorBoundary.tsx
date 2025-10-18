/**
 * Error Boundary Component - Graceful error handling for async operations
 */

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ApiErrorBoundaryProps {
  error: Error | null;
  status: "idle" | "loading" | "success" | "error" | "timeout";
  onRetry: () => void;
  fallbackMessage?: string;
  children?: React.ReactNode;
}

export const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({
  error,
  status,
  onRetry,
  fallbackMessage = "Something went wrong",
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (status === "success") {
      setIsVisible(false);
    } else if (status === "error" || status === "timeout") {
      setIsVisible(true);
    }
  }, [status]);

  if (!isVisible || (status !== "error" && status !== "timeout")) {
    return children || null;
  }

  const errorMessage =
    status === "timeout"
      ? "Request timed out. The backend may be unresponsive."
      : error?.message || fallbackMessage;

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          Error Loading Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onRetry}
            className="gap-2"
            variant="default"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsVisible(false)}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

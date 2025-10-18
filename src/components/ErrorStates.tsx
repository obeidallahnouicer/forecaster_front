// Error and empty state components

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  RefreshCw,
  InboxIcon,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  error,
  onRetry,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-destructive/10 rounded-lg text-destructive mt-1">
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>

            {error && (
              <p className="text-xs text-muted-foreground mt-2 bg-background/50 p-2 rounded font-mono break-all">
                {typeof error === "string" ? error : error.message}
              </p>
            )}

            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-2"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = InboxIcon,
  title = "No data available",
  message = "There's nothing to display here yet.",
  action,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 bg-muted rounded-lg mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>

      {action && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  </motion.div>
);

interface TimeoutStateProps {
  onRetry?: () => void;
  className?: string;
}

export const TimeoutState: React.FC<TimeoutStateProps> = ({
  onRetry,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
  >
    <Card className="border-yellow-200/50 bg-yellow-50/50 dark:bg-yellow-950/30 dark:border-yellow-900/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100/50 dark:bg-yellow-900/50 rounded-lg text-yellow-700 dark:text-yellow-400 mt-1">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-400">
              Request Timeout
            </h3>
            <p className="text-sm text-yellow-800/70 dark:text-yellow-300/70 mt-1">
              The request took too long to complete. The server might be busy or your
              connection is slow.
            </p>

            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-2"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface ValidationErrorProps {
  errors: string[];
  className?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  errors,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className={className}
  >
    <Card className="border-red-200/50 bg-red-50/50 dark:bg-red-950/30 dark:border-red-900/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">
              Validation Errors
            </h3>
            <ul className="space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-800/70 dark:text-red-300/70">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnomalyAlert } from "@/domain/types";

interface AnomalyAlertComponentProps {
  alert: AnomalyAlert;
  onDismiss?: (id: string) => void;
  onAction?: (alert: AnomalyAlert) => void;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900/50",
    badgeVariant: "destructive" as const,
    accentColor: "text-red-700 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900/50",
    badgeVariant: "outline" as const,
    accentColor: "text-yellow-700 dark:text-yellow-400",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    badgeVariant: "secondary" as const,
    accentColor: "text-blue-700 dark:text-blue-400",
  },
};

export const AnomalyAlertComponent: React.FC<AnomalyAlertComponentProps> = ({
  alert,
  onDismiss,
  onAction,
}) => {
  const config = severityConfig[alert.severity];
  const IconComponent = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "relative border",
          config.bgColor,
          config.borderColor,
          "overflow-hidden transition-all duration-300 hover:shadow-md"
        )}
      >
        <div className="p-4 sm:p-5">
          <div className="flex gap-4">
            {/* Icon */}
            <div className={cn("flex-shrink-0 mt-0.5", config.accentColor)}>
              <IconComponent className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge
                  variant={config.badgeVariant}
                  className="flex-shrink-0 capitalize"
                >
                  {alert.severity}
                </Badge>
              </div>

              <p className="text-sm text-foreground/80 mb-3">
                {alert.description}
              </p>

              {/* Affected items */}
              {alert.affected_items.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Affected items:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.affected_items.slice(0, 3).map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="text-xs py-0.5"
                      >
                        {item}
                      </Badge>
                    ))}
                    {alert.affected_items.length > 3 && (
                      <Badge variant="outline" className="text-xs py-0.5">
                        +{alert.affected_items.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {alert.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => onAction?.(alert)}
                  >
                    {alert.action}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-muted-foreground"
                    onClick={() => onDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>

            {/* Close button */}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface AnomalyAlertListProps {
  alerts: AnomalyAlert[];
  onDismiss?: (id: string) => void;
  onAction?: (alert: AnomalyAlert) => void;
  maxItems?: number;
}

export const AnomalyAlertList: React.FC<AnomalyAlertListProps> = ({
  alerts,
  onDismiss,
  onAction,
  maxItems = 5,
}) => {
  const displayedAlerts = alerts.slice(0, maxItems);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {displayedAlerts.map((alert) => (
          <AnomalyAlertComponent
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Loading skeleton components for smooth data transitions

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <motion.div
    className={cn("bg-muted animate-pulse rounded", className)}
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ repeat: Infinity, duration: 2 }}
  />
);

export const SkeletonCard: React.FC = () => (
  <div className="rounded-lg border border-border p-4 space-y-3">
    <Skeleton className="h-6 w-24" />
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-4 w-16" />
  </div>
);

export const SkeletonChart: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="rounded-lg border border-border p-4">
    <Skeleton className="h-6 w-40 mb-4" />
    <Skeleton className={cn("w-full", `h-${height / 4}`)} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-lg border border-border overflow-hidden">
    <div className="p-4 bg-muted/50">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  </div>
);

export const ShimmerLoader: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn(
      "bg-gradient-to-r from-muted via-card to-muted animate-shimmer",
      className
    )}
    initial={{ backgroundPosition: "-1000px 0" }}
    animate={{ backgroundPosition: "1000px 0" }}
    transition={{ repeat: Infinity, duration: 3 }}
  />
);

export const SpinnerLoader: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <motion.div
      className={cn("border-2 border-muted border-t-primary rounded-full", sizeClasses[size])}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1 }}
    />
  );
};

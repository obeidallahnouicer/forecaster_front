import React from "react";
import { motion } from "framer-motion";

type Props = {
  title: string;
  value: React.ReactNode;
  delta?: string;
  icon?: React.ReactNode;
  className?: string;
};

export const StatCard: React.FC<Props> = ({ title, value, delta, icon, className = "" }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`p-4 rounded-lg border border-border bg-card ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground mb-1">{title}</div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      {delta && <div className="mt-3 text-sm text-muted-foreground">{delta}</div>}
    </motion.div>
  );
};

export default StatCard;

import React from "react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-3 w-3 rounded-full bg-muted animate-pulse-glow" />
      <div className="h-3 w-3 rounded-full bg-muted animate-pulse-glow delay-75" />
      <div className="h-3 w-3 rounded-full bg-muted animate-pulse-glow delay-150" />
      <span className="sr-only">Assistant is typing</span>
    </div>
  );
};

export default TypingIndicator;

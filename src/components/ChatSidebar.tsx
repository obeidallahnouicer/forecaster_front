import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { X } from "lucide-react";
import ChatPanel from "./chat/ChatPanel";

export const ChatSidebar: React.FC = () => {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const visible = isMobile ? openMobile : open;

  if (!visible) return null;

  return (
    <div className="fixed right-3 sm:right-6 top-20 sm:top-24 bottom-6 z-[60] w-[calc(100vw-1.25rem)] sm:w-[28rem] md:w-[34rem] max-w-[96vw] bg-card rounded-2xl shadow-elevated border border-border overflow-hidden flex flex-col">
      <div className="absolute right-3 top-3 flex items-center gap-2 z-20">
        <button aria-label="Close chat" onClick={() => (isMobile ? setOpenMobile(false) : setOpen(false))} className="p-2 rounded-md hover:bg-white/6">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute left-4 top-4 z-20">
        <div className="text-xs text-muted-foreground">AI Assistant</div>
        <div className="text-sm font-semibold gradient-text">Forecaster</div>
      </div>

      <div className="h-full">
        <ChatPanel initialThread="default" />
      </div>
    </div>
  );
};

export default ChatSidebar;

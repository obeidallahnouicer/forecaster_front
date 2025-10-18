import React from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  onAttach?: (file: File) => void;
};

export const ChatInput: React.FC<Props> = ({ value, onChange, onSend, disabled, onAttach }) => {
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="px-3 sm:px-4 py-3 border-t border-border bg-background/50"
    >
      <div className="flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => { if (e.target.files && e.target.files[0]) onAttach?.(e.target.files[0]); }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Attach file"
          className="px-3 py-2 rounded-md hover:bg-accent/8 text-sm text-muted-foreground"
        >
          📎
        </button>

        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Ask the assistant — press Enter to send"
          className="text-sm flex-1"
          disabled={disabled}
        />

        <Button onClick={onSend} disabled={disabled || !value.trim()} size="sm" className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </motion.div>
  );
};

export default ChatInput;

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { toast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

export const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const { uploadedFileName, setUploadedFileName, isUploading } = useUIStore();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
        setUploadedFileName(file.name);
        onFileSelect(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or XLSX file.",
          variant: "destructive",
        });
      }
    },
    [onFileSelect, setUploadedFileName]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFileName(file.name);
        onFileSelect(file);
      }
    },
    [onFileSelect, setUploadedFileName]
  );

  const clearFile = () => {
    setUploadedFileName(null);
  };

  if (uploadedFileName) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-primary/30 bg-card p-6 sm:p-8 card-elevated"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base sm:text-lg font-semibold truncate">{uploadedFileName}</p>
            <p className="text-sm sm:text-base text-muted-foreground">Dataset loaded</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={clearFile}
          className="rounded-lg p-2.5 hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 self-end sm:self-center"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <label className="relative flex cursor-pointer flex-col items-center justify-center py-16 sm:py-20 px-4 sm:px-6">
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx"
          onChange={handleFileInput}
          disabled={isUploading}
        />
        
        <motion.div
          whileHover={{ scale: 1.05, rotate: 4 }}
          className="mb-6 sm:mb-8 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary glow-primary"
        >
          <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
        </motion.div>
        
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-center">Upload Your Dataset</h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center max-w-lg px-2">
          Drop your CSV or XLSX file here, or click to browse
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2 sm:mt-3">
          Supported formats: .csv, .xlsx
        </p>
      </label>
    </motion.div>
  );
};

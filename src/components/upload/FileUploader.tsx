import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFileSelect: (file: File) => Promise<void> | void;
  disabled?: boolean;
}

export const FileUploader = ({ onFileSelect, disabled }: FileUploaderProps) => {
  const { uploadedFileName, setUploadedFileName, isUploading, setIsUploading } = useUIStore();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
        await handleUpload(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or XLSX file.",
          variant: "destructive",
        });
      }
    },
    [disabled, isUploading]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && !disabled && !isUploading) {
        await handleUpload(file);
      }
    },
    [disabled, isUploading]
  );

  const handleUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onFileSelect(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");

      toast({
        title: "Upload successful!",
        description: `${file.name} has been uploaded and processed.`,
      });
    } catch (error) {
      setUploadStatus("error");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedFileName(null);
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  if (uploadedFileName) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-4 rounded-xl sm:rounded-2xl border border-primary/30 bg-card p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
              {uploadStatus === "success" ? (
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              ) : uploadStatus === "uploading" ? (
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin" />
              ) : (
                <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-lg font-semibold truncate">{uploadedFileName}</p>
              <p className="text-sm sm:text-base text-muted-foreground">
                {uploadStatus === "uploading" ? "Uploading..." : uploadStatus === "success" ? "Upload complete" : "Dataset loaded"}
              </p>
            </div>
          </div>

          {!isUploading && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearFile}
              className="rounded-lg p-2.5 hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          )}
        </div>

        {uploadStatus === "uploading" && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-dashed transition-colors ${
        disabled || isUploading
          ? "border-border/50 bg-muted/30 cursor-not-allowed"
          : "border-border hover:border-primary/50 bg-card cursor-pointer"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <label className={`relative flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 ${disabled || isUploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx"
          onChange={handleFileInput}
          disabled={disabled || isUploading}
        />
        
        <motion.div
          whileHover={!disabled && !isUploading ? { scale: 1.05, rotate: 4 } : {}}
          className="mb-4 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary-foreground animate-spin" />
          ) : (
            <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-primary-foreground" />
          )}
        </motion.div>
        
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-center">
          {isUploading ? "Uploading..." : "Upload Your Dataset"}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground text-center max-w-lg px-2">
          {isUploading 
            ? "Please wait while we process your file" 
            : "Drop your CSV or XLSX file here, or click to browse"
          }
        </p>
        {!isUploading && (
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: .csv, .xlsx
          </p>
        )}
      </label>
    </motion.div>
  );
};

export default FileUploader;

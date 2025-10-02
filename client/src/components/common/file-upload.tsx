import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onFileUpload: (file: File) => Promise<void>;
  uploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export function FileUpload({ 
  accept = ".xlsx,.xls",
  maxSize = 50 * 1024 * 1024, // 50MB
  onFileUpload,
  uploading = false,
  uploadProgress = 0,
  className 
}: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploadedFile(file);

    try {
      await onFileUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadedFile(null);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize,
    multiple: false,
    disabled: uploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary hover:bg-primary/5",
          uploading && "pointer-events-none opacity-50"
        )}
        data-testid="file-upload-zone"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-base font-semibold text-foreground mb-2">
            {isDragActive ? "Отпустите файл сюда" : "Перетащите файл сюда"}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            или нажмите для выбора файла
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Поддерживаются форматы: .xlsx, .xls (макс. 50 МБ)</span>
          </div>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <X className="h-4 w-4 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{file.name}</div>
                <div className="text-xs text-destructive">
                  {errors.map(e => e.message).join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && uploadedFile && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <File className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{uploadedFile.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.size)} • Загрузка...
              </div>
            </div>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <X className="h-4 w-4 text-destructive flex-shrink-0" />
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {/* Success */}
      {uploadedFile && !uploading && !error && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
          <div className="text-sm text-success">Файл успешно загружен</div>
        </div>
      )}
    </div>
  );
}

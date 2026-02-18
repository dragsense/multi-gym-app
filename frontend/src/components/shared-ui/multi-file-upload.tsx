import { useState, useCallback, useId, useMemo, useTransition } from "react";
import {
  X,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  File as FileIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IFileUpload } from "@shared/interfaces/file-upload.interface";

interface MultiFileUploadProps {
  onChange?: (files: File[]) => void;
  onRemove?: (file: IFileUpload) => void;
  maxSizeInMB?: number;
  maxFiles?: number;
  acceptedTypes?: string[];
  value?: File[];
  uploadedFiles?: IFileUpload[];
  removedDocumentIds?: string[];
  disabled?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  border?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

export default function MultiFileUpload({
  onChange,
  onRemove,
  maxSizeInMB = 10,
  maxFiles = 10,
  acceptedTypes,
  value = [],
  uploadedFiles = [],
  removedDocumentIds = [],
  disabled,
  rounded = "md",
  border = "md",
}: MultiFileUploadProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file type
      if (acceptedTypes && !acceptedTypes.includes(file.type)) {
        setError(`Please upload: ${acceptedTypes.join(", ")}`);
        return false;
      }

      // Check file size
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setError(`File size must be less than ${maxSizeInMB}MB`);
        return false;
      }

      setError(null);
      return true;
    },
    [acceptedTypes, maxSizeInMB]
  );

  // React 19: Memoized file icon for better performance
  const getFileIcon = useMemo(
    () => (type: string) => {
      if (type.startsWith("image/"))
        return <FileImage className="w-6 h-6 text-blue-500" />;
      if (type.startsWith("video/"))
        return <FileVideo className="w-6 h-6 text-purple-500" />;
      if (type.startsWith("audio/"))
        return <FileAudio className="w-6 h-6 text-green-500" />;
      if (type.includes("pdf") || type.includes("document"))
        return <FileText className="w-6 h-6 text-red-500" />;
      return <FileIcon className="w-6 h-6 text-gray-500" />;
    },
    []
  );

  const handleFileUpload = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter(validateFile);
      if (validFiles.length > 0) {
        startTransition(() => {
          const currentFiles = value.filter(
            (f): f is File => f instanceof File
          );
          const totalFiles = [...currentFiles, ...validFiles];

          // Limit to maxFiles
          const limitedFiles = totalFiles.slice(0, maxFiles);
          onChange?.(limitedFiles);
        });
      }
    },
    [value, maxFiles, onChange, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(Array.from(files));
    }
  };

  const removeFile = useCallback(
    (index: number) => () => {
      startTransition(() => {
        // Remove the file at the given index
        const newValue = [...value];
        newValue.splice(index, 1);

        // Update only File instances (new uploads)
        const newFiles = newValue.filter((f): f is File => f instanceof File);
        setError(null);
        onChange?.(newFiles);
      });
    },
    [value, onChange]
  );

  const removeUploadedFile = useCallback(
    (file: IFileUpload) => () => {
      startTransition(() => {
        setError(null);
        onRemove?.(file);
      });
    },
    [onRemove]
  );

  const getFileName = (file: File | IFileUpload): string => {
    return file instanceof File ? file.name : file.name;
  };

  const getFileType = (file: File | IFileUpload): string => {
    return file instanceof File ? file.type : file.mimeType;
  };

  const getFileSize = (file: File | IFileUpload): string => {
    const size = file instanceof File ? file.size : file.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPreviewUrl = (file: File | IFileUpload): string => {
    return file instanceof File ? URL.createObjectURL(file) : file.url;
  };

  const renderUploadZone = () => {
    return (
      <div
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-${rounded} border-${border} cursor-pointer transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={acceptedTypes?.join(",")}
          onChange={handleFileSelect}
          disabled={disabled || value.length >= maxFiles}
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-lg"
        />
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center px-4">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Max {maxFiles} files, {maxSizeInMB}MB each
        </p>
      </div>
    );
  };

  const renderFileItem = (
    file: File | IFileUpload,
    index: number,
    onRemove: () => void
  ) => {

    const fileType = getFileType(file);

    return (
    <div
      key={index}
      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
    >
      {fileType.startsWith("image/") && <img src={getPreviewUrl(file)} alt={file.name} className="w-20 h-20 object-cover rounded-lg" />}
      {fileType.startsWith("video/") && <video src={getPreviewUrl(file)} alt={file.name} className="w-20 h-20 object-cover rounded-lg" />}
      {fileType.startsWith("audio/") && <audio src={getPreviewUrl(file)} alt={file.name} className="w-20 h-20 object-cover rounded-lg" />}
      {fileType.startsWith("image/") && <img src={getPreviewUrl(file)} alt={file.name} className="w-20 h-20 object-cover rounded-lg" />}
      {getFileIcon(getFileType(file))}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{getFileName(file)}</p>
        <p className="text-xs text-muted-foreground">{getFileSize(file)}</p>
      </div>
      {!disabled && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove()}
          className="flex-shrink-0"
          type="button"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      )}
    </div>
  );}

  const renderFileList = () => {
    if (value.length === 0 && uploadedFiles.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-gray-700">
          Uploaded Files ({[...value, ...uploadedFiles].length}/{maxFiles})
        </p>
        {/* Render "uploaded" files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Existing Uploaded Files
            </p>
            {uploadedFiles
              .filter((f) => !removedDocumentIds.includes(f.id))
              .map((file, idx) =>
                renderFileItem(file, idx, removeUploadedFile(file))
              )}
          </div>
        )}
        {/* Render "local" files (value) */}
        {value.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">New Files to Upload</p>
            {value.map((file, idx) =>
              renderFileItem(file, idx, removeFile(idx))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2" data-component-id={componentId}>
      {value.length < maxFiles && renderUploadZone()}
      {renderFileList()}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

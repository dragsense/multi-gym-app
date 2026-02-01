import {
  useState,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useTransition,
} from "react";
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

// Utilities
interface FileUploadProps {
  onChange?: (file: File | null) => void;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  value: File | IFileUpload | null;
  disabled?: boolean;
  variant?: "circle" | "rectangle" | "card";
}

export default function FileUpload({
  onChange,
  maxSizeInMB = 10,
  acceptedTypes,
  value,
  disabled,
  variant = "card",
}: FileUploadProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  // Convert value to preview
  useEffect(() => {
    if (value && value instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview({
          url: e.target?.result as string,
          type: value.type,
          name: value.name,
        });
      };
      reader.readAsDataURL(value);
    } else if (value && typeof value === "object" && "url" in value) {
      setPreview({
        url: value.url,
        type: value.mimeType,
        name: value.name,
      });
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateFile = (file: File): boolean => {
    // Check file type or extension
    if (acceptedTypes && acceptedTypes.length > 0) {
      const fileName = file.name.toLowerCase();
      const fileExtension = '.' + fileName.split('.').pop();
      
      // Check if acceptedTypes contains file extensions (starting with .)
      const hasFileExtensions = acceptedTypes.some(type => type.startsWith('.'));
      
      if (hasFileExtensions) {
        // Validate by file extension
        if (!acceptedTypes.some(type => type.startsWith('.') && fileName.endsWith(type.toLowerCase()))) {
          setError(`Please upload: ${acceptedTypes.filter(t => t.startsWith('.')).join(", ")}`);
          return false;
        }
      } else {
        // Validate by MIME type
        if (!acceptedTypes.includes(file.type)) {
          setError(`Please upload: ${acceptedTypes.join(", ")}`);
          return false;
        }
      }
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`File size must be less than ${maxSizeInMB}MB`);
      return false;
    }

    setError(null);
    return true;
  };

  // React 19: Memoized file icon for better performance
  const getFileIcon = useMemo(
    () => (type: string) => {
      if (type.startsWith("image/"))
        return <FileImage className="w-8 h-8 text-blue-500" />;
      if (type.startsWith("video/"))
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      if (type.startsWith("audio/"))
        return <FileAudio className="w-8 h-8 text-green-500" />;
      if (type.includes("pdf") || type.includes("document"))
        return <FileText className="w-8 h-8 text-red-500" />;
      return <FileIcon className="w-8 h-8 text-gray-500" />;
    },
    []
  );

  const handleFileUpload = (file: File) => {
    if (validateFile(file)) {
      startTransition(() => {
        onChange?.(file);
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    startTransition(() => {
      setPreview(null);
      setError(null);
      onChange?.(null);
    });
  };

  const renderPreview = () => {
    if (!preview) return null;

    // Image preview
    if (preview.type.startsWith("image/")) {
      if (variant === "circle") {
        return (
          <div className="relative w-32 h-32">
            <img
              src={preview.url}
              alt={preview.name}
              className="w-full h-full object-cover rounded-full border"
              crossOrigin="anonymous"
            />
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 bg-white/80 hover:bg-white rounded-full shadow-sm"
                onClick={removeFile}
                type="button"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        );
      }
      return (
        <div className="relative w-full max-w-md">
          <img
            src={preview.url}
            alt={preview.name}
            className="w-full h-48 object-cover rounded-lg border"
            crossOrigin="anonymous"
          />
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full shadow-sm"
              onClick={removeFile}
              type="button"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      );
    }

    // Video preview
    if (preview.type.startsWith("video/")) {
      return (
        <div className="relative w-full max-w-md">
          <video
            src={preview.url}
            controls
            className="w-full h-48 rounded-lg border"
            crossOrigin="anonymous"
          />
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full shadow-sm"
              onClick={removeFile}
              type="button"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      );
    }

    // Audio preview
    if (preview.type.startsWith("audio/")) {
      return (
        <div className="relative w-full max-w-md p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-3 mb-2">
            {getFileIcon(preview.type)}
            <div className="flex-1">
              <p className="font-medium text-sm">{preview.name}</p>
              <p className="text-xs text-muted-foreground">Audio file</p>
            </div>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                type="button"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
          <audio
            src={preview.url}
            controls
            className="w-full"
            crossOrigin="anonymous"
          />
        </div>
      );
    }

    // Generic file preview (documents, etc.)
    return (
      <div className="relative w-full max-w-md p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-3">
          {getFileIcon(preview.type)}
          <div className="flex-1">
            <p className="font-medium text-sm">{preview.name}</p>
            <p className="text-xs text-muted-foreground">{preview.type}</p>
            {value && typeof value === "object" && "url" in value && (
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View File
              </a>
            )}
          </div>
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              type="button"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderUploadZone = () => {
    const sizeClass =
      variant === "circle"
        ? "w-32 h-32 rounded-full"
        : "w-full h-48 rounded-lg";
    const borderClass =
      variant === "circle"
        ? "border-2 border-dashed"
        : "border-2 border-dashed";

    return (
      <div
        className={`relative flex flex-col items-center justify-center ${sizeClass} ${borderClass} cursor-pointer transition-colors ${
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
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${
            variant === "circle" ? "rounded-full" : "rounded-lg"
          }`}
        />
        <Upload
          className={`text-gray-400 mb-2 ${
            variant === "circle" ? "w-4 h-4" : "w-8 h-8"
          }`}
        />
        <p
          className={`text-sm text-gray-500 text-center px-4 ${
            variant === "circle" ? "text-xs" : "text-sm"
          }`}
        >
          Drop file here or click to browse
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Max size: {maxSizeInMB}MB
        </p>
      </div>
    );
  };

  return (
    <div
      className="w-full flex flex-col items-center gap-2"
      data-component-id={componentId}
    >
      {preview ? renderPreview() : renderUploadZone()}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {!error && preview && (
        <p className="text-sm text-gray-500 text-center">
          {preview.type.startsWith("image/") ? "Change image" : "Change file"}
        </p>
      )}
    </div>
  );
}

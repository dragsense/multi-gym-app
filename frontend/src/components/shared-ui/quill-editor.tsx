import React, { useRef, useEffect, useMemo } from "react";
import { useId } from "react";
import Quill, { Delta } from "quill";
import { cn } from "@/lib/utils";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
  modules?: Record<string, any>;
  formats?: string[];
}

// Default toolbar configuration
const DEFAULT_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    [{ align: [] }],
  ],
};

const DEFAULT_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "align",
];

export const QuillEditor = React.memo(function QuillEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = "200px",
  className,
  modules,
  formats,
}: QuillEditorProps) {
  const componentId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const isUpdatingFromPropsRef = useRef(false);

  // Merge user-provided modules with defaults
  const editorModules = useMemo(
    () => ({
      ...DEFAULT_MODULES,
      ...modules,
    }),
    [modules]
  );

  // Merge user-provided formats with defaults
  const editorFormats = useMemo(
    () => formats || DEFAULT_FORMATS,
    [formats]
  );

  // Initialize Quill editor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevent double initialization - check ref first
    if (quillInstanceRef.current) return;
    
    // Always ensure container is clean before initializing (handles StrictMode)
    const existingToolbar = container.querySelector(".ql-toolbar");
    const existingContainer = container.querySelector(".ql-container");
    if (existingToolbar || existingContainer) {
      // Remove any existing Quill elements
      container.innerHTML = "";
    }
  
    try {
      const quill = new Quill(container, {
        theme: "snow",
        placeholder,
        readOnly,
        modules: editorModules,
        formats: editorFormats,
      });

      quillInstanceRef.current = quill;

      // Set initial value
      if (value) {
        quill.root.innerHTML = value;
      }

      // Handle text changes
      const handleTextChange = (delta: Delta, oldDelta: Delta, source: string) => {
        if (isUpdatingFromPropsRef.current) {
          return;
        }

        const content = quill.root.innerHTML;
        if (content !== value) {
          onChange(content);
        }
      };

      quill.on("text-change", handleTextChange);

      return () => {
        // Cleanup function
        
        if (quillInstanceRef.current) {
          const instance = quillInstanceRef.current;
          try {
            instance.off("text-change");
          } catch (e) {
            // Ignore errors during cleanup
          }
          quillInstanceRef.current = null;
        }
        
        // Clean up DOM elements - remove Quill-generated elements
        if (containerRef.current) {
          const toolbar = containerRef.current.querySelector(".ql-toolbar");
          const editorContainer = containerRef.current.querySelector(".ql-container");
          if (toolbar) toolbar.remove();
          if (editorContainer) editorContainer.remove();
        }
      };
    } catch (error) {
      console.error("Failed to initialize Quill editor:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once - modules/formats are merged from props

  // Update readOnly state
  useEffect(() => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Update value when it changes externally
  useEffect(() => {
    if (!quillInstanceRef.current) return;

    const currentContent = quillInstanceRef.current.root.innerHTML;
    if (value !== currentContent) {
      isUpdatingFromPropsRef.current = true;
      const selection = quillInstanceRef.current.getSelection();
      quillInstanceRef.current.root.innerHTML = value || "";
      
      // Restore selection if it existed
      if (selection) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (quillInstanceRef.current) {
            quillInstanceRef.current.setSelection(selection);
          }
          isUpdatingFromPropsRef.current = false;
        });
      } else {
        isUpdatingFromPropsRef.current = false;
      }
    }
  }, [value]);

  return (
    <div
      className={cn(
        "relative quill-editor-wrapper",
        readOnly && "opacity-50 cursor-not-allowed",
        className
      )}
      data-component-id={componentId}
    >
      <div
        ref={containerRef}
        className="quill-editor"
        style={{
          minHeight,
        }}
      />
      <style>{`
        [data-component-id="${componentId}"] .ql-container {
          min-height: ${minHeight};
        }
        [data-component-id="${componentId}"] .ql-editor {
          min-height: calc(${minHeight} - 42px);
        }
      `}</style>
    </div>
  );
});

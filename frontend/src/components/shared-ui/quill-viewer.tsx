import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillViewerProps {
  value?: string;
}

const QuillViewer = ({ value }: QuillViewerProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "bubble",
        readOnly: true,
        modules: {
          toolbar: false,
        },
      });
    }

    if (quillRef.current && value !== undefined) {
      const currentContent = quillRef.current.root.innerHTML;
      if (currentContent !== value) {
        quillRef.current.root.innerHTML = value ?? "";
      }
    }
  }, [value]);

  // Handle link clicks to ensure external navigation in new tab
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href) {
        e.preventDefault();
        let url = anchor.getAttribute("href") || "";

        // Ensure absolute URL if it lacks protocol
        if (
          !url.match(/^https?:\/\//i) &&
          !url.startsWith("/") &&
          !url.startsWith("#")
        ) {
          url = `https://${url}`;
        }

        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    const element = editorRef.current;
    if (element) {
      element.addEventListener("click", handleLinkClick);
    }

    return () => {
      if (element) {
        element.removeEventListener("click", handleLinkClick);
      }
    };
  }, []);

  return (
    <div className="quill-viewer-container">
      <style>{`
        .quill-viewer-container .ql-editor a {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .quill-viewer-container .ql-container.ql-bubble {
          border: none;
        }
        .quill-viewer-container .ql-editor {
          padding: 0;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
};

export default QuillViewer;

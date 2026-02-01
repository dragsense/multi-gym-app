import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IFileUpload } from "@shared/interfaces/file-upload.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { FileList, FileView } from "@/components/admin";

// Page Components
import { FileForm, type TFileExtraProps } from "@/page-components";

// API
import { deleteFile, fetchFile, fetchFiles } from "@/services/file.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { FileListDto } from "@shared/dtos/file-upload-dtos/file-upload.dto";

export default function FilesPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "file";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
      <SingleHandler<IFileUpload, TFileExtraProps>
        queryFn={fetchFile}
        deleteFn={deleteFile}
        storeKey={STORE_KEY}
        onDeleteSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
          });
        }}
        SingleComponent={FileView}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: FileForm,
          },
        ]}
      />

      <ListHandler<IFileUpload, any, any, IFileUpload, any>
        queryFn={fetchFiles}
        ListComponent={FileList}
        dto={FileListDto}
        storeKey={STORE_KEY}
      />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;


import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IDeviceReader } from "@shared/interfaces/device-reader.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { DeviceReaderList, DeviceReaderView } from "@/components/admin";

// Page Components
import { DeviceReaderForm, DeviceReaderDelete, DeviceReaderStatusUpdate, type TDeviceReaderExtraProps } from "@/page-components";

// API
import { deleteDeviceReader, fetchDeviceReader, fetchDeviceReaders } from "@/services/device-reader.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { DeviceReaderListDto } from "@shared/dtos";

export default function DeviceReadersPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  const STORE_KEY = "device-reader";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        <SingleHandler<IDeviceReader, TDeviceReaderExtraProps>
          queryFn={fetchDeviceReader}
          storeKey={STORE_KEY}
          SingleComponent={DeviceReaderView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: DeviceReaderForm,
            },
            {
              action: "delete",
              comp: DeviceReaderDelete,
            },
            {
              action: "updateStatus",
              comp: DeviceReaderStatusUpdate,
            },
          ]}
        />

        <ListHandler<IDeviceReader, any, any, IDeviceReader, any>
          queryFn={fetchDeviceReaders}
          ListComponent={DeviceReaderList}
          deleteFn={deleteDeviceReader}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
            });
          }}
          dto={DeviceReaderListDto}
          storeKey={STORE_KEY}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;


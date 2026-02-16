import { useQueryClient } from "@tanstack/react-query";

// Types
import type { ICamera } from '@shared/interfaces/camera.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { CameraList, CameraView } from "@/components/admin/cameras";

// Services
import { fetchCameras, fetchCamera, deleteCamera } from '@/services/camera.api';

// Page Components
import { CameraForm, CameraUpdateStatus } from "@/page-components/camera";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { TCameraListData } from "@shared/types/camera.type";
import type { TCameraViewExtraProps } from "@/components/admin/cameras/view/camera-view";
import type { ICameraListExtraProps } from "@/components/admin/cameras/list/camera-list";
import { CameraListDto } from "@shared/dtos";
import { getSelectedLocation } from "@/utils/location-storage";

export default function CamerasPage() {
    const queryClient = useQueryClient();

    const CAMERAS_STORE_KEY = 'camera';
    const location = getSelectedLocation();

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<ICamera>
                queryFn={fetchCamera}
                initialParams={{
                    _relations: 'location, door',
                }}
                storeKey={CAMERAS_STORE_KEY}
                SingleComponent={CameraView}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: CameraForm
                    },
              
                    {
                        action: 'updateStatus',
                        comp: CameraUpdateStatus
                    },
                ]}
            />

            <ListHandler<ICamera, TCameraListData, ICameraListExtraProps, ICamera, TCameraViewExtraProps>
                queryFn={(params) => fetchCameras(params, location?.id)}
                initialParams={{
                    _relations: 'location, door',
                    sortBy: 'createdAt',
                    sortOrder: 'DESC',
                }}
                ListComponent={CameraList}
                deleteFn={deleteCamera}
                onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: [CAMERAS_STORE_KEY + "-list"] })}
                dto={CameraListDto}
                storeKey={CAMERAS_STORE_KEY}
                listProps={{}}
            />
        </PageInnerLayout>
    );
}

const Header = () => null;

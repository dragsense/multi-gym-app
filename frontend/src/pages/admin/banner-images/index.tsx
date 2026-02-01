import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { type IBannerImage } from "@shared/interfaces/advertisement.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Custom UI Components
import { BannerImageList, BannerImageView } from "@/components/admin";

// Page Components
import { BannerImageForm, BannerImageDelete, type TBannerImageExtraProps } from "@/page-components";

// API
import { deleteBannerImage, fetchBannerImage, fetchBannerImages } from "@/services/banner-image.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { BannerImageListDto } from "@shared/dtos";

export default function BannerImagesPage() {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const queryClient = useQueryClient();

    const STORE_KEY = "banner-image";

    return (
        <PageInnerLayout Header={<Header />}>
            <div data-component-id={componentId}>
                <SingleHandler<IBannerImage, TBannerImageExtraProps>
                    queryFn={fetchBannerImage}
                    storeKey={STORE_KEY}
                    initialParams={{
                        _relations: "image",
                    }}
                    SingleComponent={BannerImageView}
                    actionComponents={[
                        {
                            action: "createOrUpdate",
                            comp: BannerImageForm,
                        },
                        {
                            action: "delete",
                            comp: BannerImageDelete,
                        },
                    ]}
                />

                <ListHandler<IBannerImage, any, any, IBannerImage, any>
                    queryFn={fetchBannerImages}
                    initialParams={{
                        _relations: "image",
                    }}
                    ListComponent={BannerImageList}
                    deleteFn={deleteBannerImage}
                    onDeleteSuccess={() => {
                        startTransition(() => {
                            queryClient.invalidateQueries({ queryKey: [STORE_KEY + "-list"] });
                        });
                    }}
                    dto={BannerImageListDto}
                    storeKey={STORE_KEY}
                />
            </div>
        </PageInnerLayout>
    );
}

const Header = () => null;


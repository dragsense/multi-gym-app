import { useId } from "react";

// Handlers
import { SingleHandler } from "@/handlers";

// Page Components
import { UserSettingsFormHandler } from "@/page-components";

// Services
import { fetchMySettings } from "@/services/settings.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

export default function UserSettingsPage() {
    // React 19: Essential IDs
    const componentId = useId();

    const STORE_KEY = 'settings';

    return (
        <PageInnerLayout Header={<Header />}>
            <div data-component-id={componentId}>
                <SingleHandler<IUserSettings, any>
                    queryFn={fetchMySettings}
                    storeKey={STORE_KEY}
                    SingleComponent={UserSettingsFormHandler}
                    enabled={true}
                />
            </div>
        </PageInnerLayout>
    );
}

const Header = () => null

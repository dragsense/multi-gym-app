import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableUsers } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { UserDto } from "@shared/dtos";
import { apiRequest } from "@/utils/fetcher";
import { toast } from "sonner";

interface ICheckinTestButtonProps {
    onSuccess?: () => void;
}

export function CheckinTestButton({ onSuccess }: ICheckinTestButtonProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, startTransition] = useTransition();

    const searchableUsers = useSearchableUsers({});

    const handleTestCheckin = async () => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            const response = await apiRequest(
                "/checkins/Device/OpenDoor",
                "POST",
                {
                    SCode: JSON.stringify({ userId: selectedUser.id }),
                    deviceId: "TEST_BROWSER_DEVICE",
                    location: "Browser Manual Test",
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            );

            if (response && (response as any).Msg) {
                toast.success(`Result: ${(response as any).Msg}`);
            } else {
                toast.success("Check-in triggered successfully");
            }

            setOpen(false);
            setSelectedUser(null);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to trigger check-in");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Test Device
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Test Device Check-in</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Select User</Label>
                        <SearchableInputWrapper<UserDto>
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val)}
                            useSearchable={() => searchableUsers}
                            getLabel={(item) => {
                                if (!item) return "Select User";
                                return `${item.firstName} ${item.lastName} (${item.email})`;
                            }}
                            getKey={(item) => item.id.toString()}
                            getValue={(item) => item}
                            shouldFilter={false}
                            modal={true}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTestCheckin}
                        disabled={!selectedUser || isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Trigger Check-in
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

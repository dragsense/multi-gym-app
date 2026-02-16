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
import { Loader2, Radio } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableMembers, useSearchableUsers } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { IMember, IUser } from "@shared/interfaces";
import { apiRequest } from "@/utils/fetcher";
import { toast } from "sonner";

interface ICheckinMainDoorButtonProps {
    onSuccess?: () => void;
}

export function CheckinMainDoorButton({ onSuccess }: ICheckinMainDoorButtonProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, startTransition] = useTransition();

    const searchableUsers = useSearchableUsers({});

    // Hardcoded macAddress for Main Door Checkin Device
    const macAddress = "252626265256";
    const deviceName = "Main Door Checkin Device";

    const handleRfidCheckin = async () => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            const response = await apiRequest(
                "/checkins/Device/OpenDoor",
                "POST",
                {
                    SCode: JSON.stringify({ userId: selectedUser.id }),
                    macAddress: macAddress,
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
                    <Radio className="h-4 w-4" />
                    Main Door Check-in
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{deviceName} Check-in Test</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>MAC Address</Label>
                        <div className="text-sm text-muted-foreground font-mono p-2 bg-muted rounded-md">
                            {macAddress}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Select Member</Label>
                        <SearchableInputWrapper<IUser>
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val)}
                            useSearchable={() => searchableUsers}
                            getLabel={(item) => {
                                if (!item?.firstName) return "Select Member";
                                return `${item.firstName} ${item.lastName} (${item.email})`;
                            }}
                            getKey={(item) => item.id.toString()}
                            getValue={(item) => {
                                return {
                                    id: item.id,
                                    firstName: item.firstName,
                                    lastName: item.lastName,
                                    email: item.email,
                                } as IUser;
                            }}
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
                        onClick={handleRfidCheckin}
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


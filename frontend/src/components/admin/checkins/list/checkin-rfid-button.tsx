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
import { useSearchableMembers } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { IMember } from "@shared/interfaces";
import { apiRequest } from "@/utils/fetcher";
import { toast } from "sonner";

interface ICheckinRfidButtonProps {
    onSuccess?: () => void;
}

export function CheckinRfidButton({ onSuccess }: ICheckinRfidButtonProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<IMember | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [, startTransition] = useTransition();

    const searchableMembers = useSearchableMembers({});

    // Hardcoded macAddress for testing
    // TODO: Update with the correct macAddress for this device
    const macAddress = ""; // Set the macAddress here

    const handleRfidCheckin = async () => {
        if (!selectedMember || !selectedMember.user) return;

        setIsSubmitting(true);
        try {
            
            const response = await apiRequest(
                "/checkins/Device/OpenDoor",
                "POST",
                {
                    SCode: JSON.stringify({ userId: selectedMember.user.id }),
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
            setSelectedMember(null);
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
                    Device Reader Check-in
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Device Reader Check-in Test</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>MAC Address (Test)</Label>
                        <div className="text-sm text-muted-foreground font-mono p-2 bg-muted rounded-md">
                            {macAddress || "Not set - please update macAddress"}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Select Member</Label>
                        <SearchableInputWrapper<IMember>
                            value={selectedMember}
                            onChange={(val) => setSelectedMember(val)}
                            useSearchable={() => searchableMembers}
                            getLabel={(item) => {
                                if (!item?.user?.firstName) return "Select Member";
                                return `${item.user.firstName} ${item.user.lastName} (${item.user.email})`;
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
                        onClick={handleRfidCheckin}
                        disabled={!selectedMember || !selectedMember.user || isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Trigger Check-in
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


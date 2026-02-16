// External Libraries
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Services
import { logout, logoutAll } from "@/services/auth.api";


export const useLogout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    
    const handleLogout = async (all: boolean = false) => {
        setIsLoading(true);
        try {
            startTransition(async () => {
                if (all) await logoutAll();
                else await logout();
                queryClient.invalidateQueries({ queryKey: ["me"] });
                window.location.reload();
            });
        } catch (error) {
            if (error instanceof Error) {
                toast.error("Logout failed: " + error.message);
            }
            console.error("Logout error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { logout: handleLogout, isLoading };
};
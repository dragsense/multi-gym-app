import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/services/user.api";
import type { IProfile } from "@shared/interfaces/user.interface";

export const useMyProfile = () => {
    const {
        data: profile,
        isLoading,
        error,
    } = useQuery<IProfile>({
        queryKey: ["myProfile"],
        queryFn: fetchMyProfile,
        retry: false,
    });

    return { profile, isLoading, error };
};

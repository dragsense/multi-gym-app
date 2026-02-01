import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCameraStream, startCameraStream } from "@/services/stream.api";
import type { IStreamResponse } from "@shared/interfaces/stream.interface";

/**
 * Hook to get camera stream URLs (does not start stream)
 */
export function useCameraStream(cameraId: string | null, autoStart = true) {
  const queryClient = useQueryClient();

  // Get stream URLs
  const query = useQuery<IStreamResponse>({
    queryKey: ["camera-stream", cameraId],
    queryFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return getCameraStream(cameraId);
    },
    enabled: !!cameraId && autoStart,
  });

  // Start stream mutation
  const startMutation = useMutation({
    mutationFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return startCameraStream(cameraId);
    },
    onSuccess: (data) => {
      // Update query data with stream URLs from start response
      queryClient.setQueryData(["camera-stream", cameraId], data);
    },
  });

  return {
    ...query,
    start: () => startMutation.mutate(),
    isStarting: startMutation.isPending,
  };
}

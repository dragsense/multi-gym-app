import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCameraStream, startCameraStream } from "@/services/stream.api";
import type { IStreamResponse } from "@shared/interfaces/stream.interface";
import { useState } from "react";

/**
 * Hook to get camera stream URLs (does not start stream)
 */
export function useCameraStream(cameraId: string) {
  const queryClient = useQueryClient();
  const [isStarted, setIsStarted] = useState(false);

  // Get stream URLs
  const query = useQuery<IStreamResponse>({
    queryKey: ["camera-stream", cameraId],
    queryFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return getCameraStream(cameraId);
    },
    enabled: isStarted,
  });

  // Start stream mutation
  const startMutation = useMutation({
    mutationFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return startCameraStream(cameraId);
    },
    onSuccess: () => {
      setIsStarted(true);
    },
  });

  return {
    ...query,
    // Return the promise so caller can await and get fresh data
    start: () => startMutation.mutateAsync(),
    isStarting: startMutation.isPending,
    stop: () => setIsStarted(false),
  };
}

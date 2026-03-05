import { useQuery } from "@tanstack/react-query";
import { getCameraStream } from "@/services/stream.api";
import type { IStreamResponse } from "@shared/interfaces/stream.interface";

/** Hook to get camera stream URLs (HLS + WebRTC) from MediaMTx. No start/stop; path is ensured on GET. */
export function useCameraStream(cameraId: string) {
  const query = useQuery<IStreamResponse>({
    queryKey: ["camera-stream", cameraId],
    queryFn: () => {
      if (!cameraId) throw new Error("Camera ID is required");
      return getCameraStream(cameraId);
    },
    enabled: !!cameraId,
  });

  return query;
}

/**
 * Get stream key from camera ID (remove dashes)
 */
export function getStreamKey(cameraId: string): string {
  return cameraId.replace(/-/g, '');
}

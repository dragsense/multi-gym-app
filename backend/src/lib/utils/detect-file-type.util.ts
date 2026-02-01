import { EFileType } from '@shared/enums/file-upload.enum';

/**
 * Detect file type based on MIME type
 * @param mimetype - The MIME type of the file
 * @returns The detected EFileType
 */
export function detectFileType(mimetype: string): EFileType {
  if (mimetype.startsWith('image/')) {
    return EFileType.IMAGE;
  } else if (mimetype.startsWith('video/')) {
    return EFileType.VIDEO;
  } else if (mimetype.startsWith('audio/')) {
    return EFileType.AUDIO;
  } else if (
    mimetype.includes('pdf') ||
    mimetype.includes('document') ||
    mimetype.includes('text') ||
    mimetype.includes('word') ||
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('powerpoint') ||
    mimetype.includes('presentation')
  ) {
    return EFileType.DOCUMENT;
  } else {
    return EFileType.OTHER;
  }
}

/**
 * Get human-readable file type name
 * @param mimetype - The MIME type of the file
 * @returns Human-readable file type
 */
export function getFileTypeName(mimetype: string): string {
  const type = detectFileType(mimetype);
  const typeNames: Record<EFileType, string> = {
    [EFileType.IMAGE]: 'Image',
    [EFileType.VIDEO]: 'Video',
    [EFileType.AUDIO]: 'Audio',
    [EFileType.DOCUMENT]: 'Document',
    [EFileType.OTHER]: 'File',
  };
  return typeNames[type] || 'File';
}

/**
 * Check if file is an image
 * @param mimetype - The MIME type of the file
 * @returns True if file is an image
 */
export function isImageFile(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

/**
 * Check if file is a video
 * @param mimetype - The MIME type of the file
 * @returns True if file is a video
 */
export function isVideoFile(mimetype: string): boolean {
  return mimetype.startsWith('video/');
}

/**
 * Check if file is an audio
 * @param mimetype - The MIME type of the file
 * @returns True if file is audio
 */
export function isAudioFile(mimetype: string): boolean {
  return mimetype.startsWith('audio/');
}

/**
 * Check if file is a document
 * @param mimetype - The MIME type of the file
 * @returns True if file is a document
 */
export function isDocumentFile(mimetype: string): boolean {
  return detectFileType(mimetype) === EFileType.DOCUMENT;
}


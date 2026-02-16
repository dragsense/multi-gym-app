import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { EFileType } from '@shared/enums/file-upload.enum';
import * as sharp from 'sharp';
import { detectFileType, isImageFile } from '@/lib/utils/detect-file-type.util';

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  minSize?: number; // in bytes
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  allowedTypes?: EFileType[];
  required?: boolean;
  // Image specific options
  minWidth?: number; 
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  validateImageDimensions?: boolean;
  validateBannerAspectRatio?: boolean; // For banner format (width >= 2x height)
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions = {}) {
    // Set defaults
    this.options.maxSize = this.options.maxSize || 10 * 1024 * 1024; // 10MB default
    this.options.required = this.options.required !== undefined ? this.options.required : true;
  }

  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    // Check if file is required
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('File is required');
      }
      return file;
    }

    // Validate minimum file size
    if (this.options.minSize && file.size < this.options.minSize) {
      const minSizeKB = (this.options.minSize / 1024).toFixed(2);
      throw new BadRequestException(
        `File size must be at least ${minSizeKB}KB`,
      );
    }

    // Validate maximum file size
    if (this.options.maxSize && file.size > this.options.maxSize) {
      const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Validate mime type
    if (this.options.allowedMimeTypes && this.options.allowedMimeTypes.length > 0) {
      if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`,
        );
      }
    }

    // Validate file extension
    if (this.options.allowedExtensions && this.options.allowedExtensions.length > 0) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (!ext || !this.options.allowedExtensions.includes(ext)) {
        throw new BadRequestException(
          `Invalid file extension. Allowed extensions: ${this.options.allowedExtensions.join(', ')}`,
        );
      }
    }

    // Validate file type based on detected type
    if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
      const detectedType = detectFileType(file.mimetype);
      if (!this.options.allowedTypes.includes(detectedType)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${this.options.allowedTypes.join(', ')}`,
        );
      }
    }

    // Validate image dimensions using sharp
    if (this.options.validateImageDimensions && isImageFile(file.mimetype)) {
      await this.validateImageDimensions(file);
    }

    return file;
  }

  private async validateImageDimensions(file: Express.Multer.File): Promise<void> {
    try {
      const metadata = await sharp(file.buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image data');
      }

      // Validate minimum dimensions
      if (this.options.minWidth && metadata.width < this.options.minWidth) {
        throw new BadRequestException(
          `Image width must be at least ${this.options.minWidth}px (current: ${metadata.width}px)`,
        );
      }

      if (this.options.minHeight && metadata.height < this.options.minHeight) {
        throw new BadRequestException(
          `Image height must be at least ${this.options.minHeight}px (current: ${metadata.height}px)`,
        );
      }

      // Validate maximum dimensions
      if (this.options.maxWidth && metadata.width > this.options.maxWidth) {
        throw new BadRequestException(
          `Image width must not exceed ${this.options.maxWidth}px (current: ${metadata.width}px)`,
        );
      }

      if (this.options.maxHeight && metadata.height > this.options.maxHeight) {
        throw new BadRequestException(
          `Image height must not exceed ${this.options.maxHeight}px (current: ${metadata.height}px)`,
        );
      }

      // Validate aspect ratio for banner format (width should be at least 2x height for banner format)
      if (this.options.validateBannerAspectRatio) {
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio < 2) {
          throw new BadRequestException(
            `Image must be in banner format (landscape/wide). Width should be at least 2x the height. Current aspect ratio: ${aspectRatio.toFixed(2)}:1`,
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate image: Invalid image file');
    }
  }
}

// Predefined pipes for common use cases
@Injectable()
export class ImageValidationPipe extends FileValidationPipe {
  constructor(options?: {
    maxSize?: number;
    minSize?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  }) {
    super({
      maxSize: options?.maxSize || 5 * 1024 * 1024, // 5MB default for images
      minSize: options?.minSize || 10 * 1024, // 10KB minimum
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
      allowedTypes: [EFileType.IMAGE],
      validateImageDimensions: true,
      minWidth: options?.minWidth || 200,
      maxWidth: options?.maxWidth || 4000,
      minHeight: options?.minHeight || 200,
      maxHeight: options?.maxHeight || 4000,
    });
  }
}

@Injectable()
export class DocumentValidationPipe extends FileValidationPipe {
  constructor(maxSize?: number) {
    super({
      maxSize: maxSize || 10 * 1024 * 1024, // 10MB default for documents
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
      allowedTypes: [EFileType.DOCUMENT],
    });
  }
}

@Injectable()
export class VideoValidationPipe extends FileValidationPipe {
  constructor(maxSize?: number) {
    super({
      maxSize: maxSize || 100 * 1024 * 1024, // 100MB default for videos
      allowedMimeTypes: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ],
      allowedTypes: [EFileType.VIDEO],
    });
  }
}

@Injectable()
export class AudioValidationPipe extends FileValidationPipe {
  constructor(maxSize?: number) {
    super({
      maxSize: maxSize || 20 * 1024 * 1024, // 20MB default for audio
      allowedMimeTypes: [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
      ],
      allowedTypes: [EFileType.AUDIO],
    });
  }
}


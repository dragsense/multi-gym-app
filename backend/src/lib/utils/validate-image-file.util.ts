// src/utils/validate-image-file.util.ts
import { BadRequestException } from '@nestjs/common';

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/gif'];

export function validateImageFile(file: Express.Multer.File): void {
  if (!file) throw new BadRequestException('No file uploaded');

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new BadRequestException(
      `Invalid file type (${file.mimetype}). Allowed: ${ALLOWED_TYPES.join(', ')}`,
    );
  }

  if (file.size > MAX_SIZE) {
    throw new BadRequestException(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 3MB`,
    );
  }
}

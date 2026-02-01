import { CreateFileUploadDto, UpdateFileUploadDto } from '../dtos/file-upload-dtos/file-upload.dto';
import { EFileType } from '../enums';

export type TFileUploadData = CreateFileUploadDto;
export type TFileUpdateData = UpdateFileUploadDto;

export type TFileCreateData = {
  name: string;
  type: EFileType;
  url: string;
  folder?: string;
  mimeType?: string;
  size?: number;
};
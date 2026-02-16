import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  Delete,
  Post,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import {
  FileListDto,
  CreateFileUploadDto,
  UpdateFileUploadDto,
} from '@shared/dtos/file-upload-dtos/file-upload.dto';
import { AuthUser } from '@/decorators/user.decorator';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { Response } from 'express';
import { User } from '@/common/base-user/entities/user.entity';
import { FileValidationPipe } from '@/pipes/file-validation.pipe';
import { OmitType } from '@shared/lib/type-utils';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { FileUpload } from './entities/file-upload.entity';

@ApiTags('File Upload')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of File' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  findAll(@Query() queryDto: FileListDto) {
    return this.fileUploadService.get(queryDto, FileListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({ status: 200, description: 'File found' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'File ID' })
  findOne(
    @Param('id') id: string,
    @Query() queryDto: SingleQueryDto<FileUpload>,
  ) {
    return this.fileUploadService.getSingle(id, queryDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create or upload a file' })
  @ApiResponse({ status: 201, description: 'File created successfully' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateFileUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async createFile(
    @Body() createDto: OmitType<CreateFileUploadDto, 'file'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 50 * 1024 * 1024,
        minSize: 1024,
        required: false,
        validateImageDimensions: true,
        minWidth: 100,
        maxWidth: 4000,
        minHeight: 100,
        maxHeight: 4000,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const createdFile = await this.fileUploadService.createFile(
      createDto,
      file,
    );
    return { message: 'File created successfully', data: createdFile };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata or upload new file' })
  @ApiResponse({ status: 200, description: 'File updated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'File ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateFileUploadDto })
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @Param('id') id: string,
    @Body() updateData: OmitType<UpdateFileUploadDto, 'file'>,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 50 * 1024 * 1024,
        minSize: 1024,
        required: false,
        validateImageDimensions: true,
        minWidth: 100,
        maxWidth: 4000,
        minHeight: 100,
        maxHeight: 4000,
      }),
    )
    file?: Express.Multer.File,
  ) {
    const updatedFile = await this.fileUploadService.updateFile(
      id,
      updateData,
      file,
    );
    return { message: 'File updated successfully', data: updatedFile };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file by ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiParam({ name: 'id', type: 'string', description: 'File ID' })
  async deleteFile(
    @Param('id') id: string,
    @Query() queryDto: SingleQueryDto<FileUpload>,
  ) {
    const file = await this.fileUploadService.getSingle(id, queryDto);
    if (!file) throw new NotFoundException('File not found');
    await this.fileUploadService.deleteFile(file);
    return { message: 'File deleted successfully' };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file by ID (with access check)' })
  @ApiParam({ name: 'id', type: 'string', description: 'File ID' })
  async downloadFile(
    @Param('id') id: string,
    @Query() queryDto: SingleQueryDto<FileUpload>,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    const file = await this.fileUploadService.getSingle(id, queryDto);
    if (!file) throw new NotFoundException('File not found');

    const filePath = join(process.cwd(), 'private', file.path);
    if (!existsSync(filePath))
      throw new NotFoundException('File missing on server');

    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    createReadStream(filePath).pipe(res);
  }
}

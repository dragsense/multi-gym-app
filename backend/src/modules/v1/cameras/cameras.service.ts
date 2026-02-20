import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { Camera } from './entities/camera.entity';
import {
  CreateCameraDto,
  UpdateCameraDto,
} from '@shared/dtos/camera-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { LocationsService } from '../locations/services/locations.service';
import { ECameraProtocol } from '@shared/enums';

@Injectable()
export class CamerasService extends CrudService<Camera> {
  private readonly cameraLogger = new Logger(CamerasService.name);

  constructor(
    @InjectRepository(Camera)
    private readonly cameraRepo: Repository<Camera>,
    private readonly locationsService: LocationsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: [
        'name',
        'description',
        'ipAddress',
      ],
    };
    super(cameraRepo, moduleRef, crudOptions);
  }

  async createCamera(
    createCameraDto: CreateCameraDto,
  ): Promise<IMessageResponse & { camera: Camera }> {
    // Validate location if provided (location is optional)
    let location;
    if (createCameraDto.location?.id) {
      location = await this.locationsService.getSingle(createCameraDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Use provided streamUrl (if any), otherwise generate from protocol, ip, port, and path
    const providedStreamUrl = createCameraDto.streamUrl?.trim();
    const streamUrl =
      providedStreamUrl && providedStreamUrl.length > 0
        ? providedStreamUrl
        : this.generateStreamUrl(
            createCameraDto.protocol,
            createCameraDto.ipAddress,
            createCameraDto.port,
            createCameraDto.path,
          );

    // Use CRUD service create method
    const camera = await this.create<CreateCameraDto>(
      createCameraDto,
      {
        beforeCreate: (processedData: CreateCameraDto) => {
          return {
            ...processedData,
            ...(location ? {
              location: {
                id: location.id,
              },
            } : {}),
            isActive: processedData.isActive ?? true,
            streamUrl,
          };
        },
      },
    );

    return { message: 'Camera created successfully.', camera };
  }


  async updateCamera(
    id: string,
    updateCameraDto: UpdateCameraDto,
  ): Promise<IMessageResponse> {
    const existingCamera = await this.getSingle(id, { _relations: ['location'] });
    if (!existingCamera) {
      throw new NotFoundException('Camera not found');
    }

    // Validate location exists if provided
    if (updateCameraDto.location?.id) {
      const location = await this.locationsService.getSingle(updateCameraDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Stream URL update rules:
    // - If streamUrl is provided, it takes precedence.
    // - Otherwise, if protocol/ip/port/path change, regenerate.
    const providedStreamUrl = updateCameraDto.streamUrl?.trim();
    const needsGeneratedStreamUrlUpdate =
      providedStreamUrl === undefined &&
      (updateCameraDto.protocol !== undefined ||
        updateCameraDto.ipAddress !== undefined ||
        updateCameraDto.port !== undefined ||
        updateCameraDto.path !== undefined);

    let streamUrl: string | undefined;
    if (providedStreamUrl && providedStreamUrl.length > 0) {
      streamUrl = providedStreamUrl;
    } else if (needsGeneratedStreamUrlUpdate) {
      const protocol = updateCameraDto.protocol ?? existingCamera.protocol;
      const ipAddress = updateCameraDto.ipAddress ?? existingCamera.ipAddress;
      const port = updateCameraDto.port ?? existingCamera.port;
      const path = updateCameraDto.path ?? existingCamera.path;
      streamUrl = this.generateStreamUrl(protocol, ipAddress, port, path);
    }

    await this.update(
      id,
      {
        ...updateCameraDto,
        ...(updateCameraDto.location?.id ? {
          location: {
            id: updateCameraDto.location.id,
          },
        } : {}),
        ...(streamUrl ? { streamUrl } : {}),
      },
    );

    return { message: 'Camera updated successfully.' };
  }

  async deleteCamera(id: string): Promise<IMessageResponse> {
    const existingCamera = await this.getSingle(id);
    if (!existingCamera) {
      throw new NotFoundException('Camera not found');
    }

    await this.delete(id);
    return { message: 'Camera deleted successfully.' };
  }

  async updateCameraStatus(
    id: string,
    isActive: boolean,
  ): Promise<IMessageResponse & { camera: Camera }> {
    const existingCamera = await this.getSingle(id);
    if (!existingCamera) {
      throw new NotFoundException('Camera not found');
    }

    const updatedCamera = await this.update(id, { isActive });

    return { message: 'Camera status updated successfully.', camera: updatedCamera };
  }

  private generateStreamUrl(
    protocol: ECameraProtocol,
    ipAddress?: string,
    port?: number,
    path?: string,
  ): string {
    if (!ipAddress) {
      return '';
    }

    const portStr = port ? `:${port}` : '';
    const pathStr = path || '/';
    const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;

    switch (protocol) {
      case ECameraProtocol.RTSP: return `rtsp://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.RTMP: return `rtmp://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.SRT: return `srt://${ipAddress}${portStr}${normalizedPath}`;
      case ECameraProtocol.HTTP_MJPEG:
      case ECameraProtocol.HLS:
        return `http://${ipAddress}${portStr}${normalizedPath}`;
      default: return '';
    }
  }
}


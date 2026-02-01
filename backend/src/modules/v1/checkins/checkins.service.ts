import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Readable } from 'stream';

import { Checkin } from './entities/checkin.entity';
import { CheckinSnapshot } from './entities/checkin-snapshot.entity';
import { Door } from '../locations/doors/entities/door.entity';
import { CreateCheckinDto, UpdateCheckinDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { UsersService } from '../users/users.service';
import { EUserLevels } from '@shared/enums/user.enum';
import { DateTime } from 'luxon';
import { ProfilesService } from '../users/profiles/profiles.service';
import { LocationsService } from '../locations/services/locations.service';
import { DoorsService } from '../locations/doors/services/doors.service';
import { DeviceReadersService } from '../device-readers/services/device-readers.service';

import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { EFileType } from '@shared/enums';
import { detectFileType } from '@/lib/utils/detect-file-type.util';
import { RequestContext } from '@/common/context/request-context';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CheckinsService extends CrudService<Checkin> {
  constructor(
    @InjectRepository(Checkin)
    private readonly checkinRepo: Repository<Checkin>,
    @InjectRepository(CheckinSnapshot)
    private readonly checkinSnapshotRepo: Repository<CheckinSnapshot>,
    @InjectRepository(Door)
    private readonly doorRepo: Repository<Door>,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly locationsService: LocationsService,
    private readonly doorsService: DoorsService,
    private readonly deviceReadersService: DeviceReadersService,
    private readonly fileUploadService: FileUploadService,
    private readonly configService: ConfigService,
    @InjectQueue('camera-snapshot') private cameraSnapshotQueue: Queue,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['user.password'],
      searchableFields: [
        'user.email',
        'user.profile.firstName',
        'user.profile.lastName',
        'location',
        'deviceId',
      ],
    };
    super(checkinRepo, moduleRef, crudOptions);
  }

  async createCheckin(
    createCheckinDto: CreateCheckinDto,
  ): Promise<IMessageResponse & { checkin: Checkin }> {
    // Check if user exists
    const user = await this.usersService.getUser(createCheckinDto.user.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate checkout time if provided
    if (createCheckinDto.checkOutTime) {
      const checkInTime = new Date(createCheckinDto.checkInTime);
      const checkOutTime = new Date(createCheckinDto.checkOutTime);

      if (checkOutTime <= checkInTime) {
        throw new BadRequestException(
          'Checkout time must be after check-in time',
        );
      }
    }

    // Validate location if provided
    if (createCheckinDto.location?.id) {
      const location = await this.locationsService.getSingle(createCheckinDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Validate door if provided
    if (createCheckinDto.door?.id) {
      const door = await this.doorsService.getSingle(createCheckinDto.door.id);
      if (!door) {
        throw new NotFoundException('Door not found');
      }
      // Validate door belongs to location if location is also provided
      if (createCheckinDto.location?.id && door.locationId !== createCheckinDto.location.id) {
        throw new BadRequestException('Door does not belong to the specified location');
      }
    }

    // Use CRUD service create method
    const checkin = await this.create<CreateCheckinDto>(
      createCheckinDto,
      {
        beforeCreate: (processedData: CreateCheckinDto) => {
          return {
            ...processedData,
            user: {
              id: processedData.user.id,
            },
            ...(processedData.location?.id ? {
              location: {
                id: processedData.location.id,
              },
            } : {}),
            ...(processedData.door?.id ? {
              door: {
                id: processedData.door.id,
              },
            } : {}),
          };
        },
      },
    );

    return { message: 'Checkin created successfully.', checkin };
  }

  async updateCheckin(
    id: string,
    updateCheckinDto: UpdateCheckinDto,
  ): Promise<IMessageResponse> {
    let userId: string | undefined;

    if (updateCheckinDto.user && updateCheckinDto.user.id) {
      // Check if user exists
      const user = await this.usersService.getUser(updateCheckinDto.user.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      userId = user.id;
    } else {
      // Get existing checkin to get user
      const existingCheckin = await this.getSingle(id, {
        _relations: ['user'],
      });
      if (existingCheckin?.user) {
        userId = existingCheckin.user.id;
      }
    }

    // Validate checkout time if provided
    if (updateCheckinDto.checkOutTime) {
      const existingCheckin = await this.getSingle(id);
      if (!existingCheckin) {
        throw new NotFoundException('Checkin not found');
      }

      const checkInTime = updateCheckinDto.checkInTime
        ? new Date(updateCheckinDto.checkInTime)
        : new Date(existingCheckin.checkInTime);
      const checkOutTime = new Date(updateCheckinDto.checkOutTime);

      if (checkOutTime <= checkInTime) {
        throw new BadRequestException(
          'Checkout time must be after check-in time',
        );
      }
    }

    // Validate location if provided
    if (updateCheckinDto.location?.id) {
      const location = await this.locationsService.getSingle(updateCheckinDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Validate door if provided
    if (updateCheckinDto.door?.id) {
      const door = await this.doorsService.getSingle(updateCheckinDto.door.id);
      if (!door) {
        throw new NotFoundException('Door not found');
      }
      // Validate door belongs to location if location is also provided
      if (updateCheckinDto.location?.id && door.locationId !== updateCheckinDto.location.id) {
        throw new BadRequestException('Door does not belong to the specified location');
      }
    }

    // Update checkin data
    await this.update(id, {
      ...updateCheckinDto,
      ...(userId && updateCheckinDto.user
        ? {
          user: {
            id: userId,
          },
        }
        : {}),
      ...(updateCheckinDto.location?.id ? {
        location: {
          id: updateCheckinDto.location.id,
        },
      } : {}),
      ...(updateCheckinDto.door?.id ? {
        door: {
          id: updateCheckinDto.door.id,
        },
      } : {}),
    });

    return {
      message: 'Checkin updated successfully',
    };
  }

  async checkoutCheckin(
    id: string,
    customCheckOutTime?: string,
  ): Promise<IMessageResponse & { checkin: Checkin }> {
    const checkin = await this.getSingle(id);

    if (!checkin) {
      throw new NotFoundException('Checkin not found');
    }

    if (checkin.checkOutTime) {
      throw new BadRequestException('Checkin already checked out');
    }

    // Use custom checkout time if provided, otherwise use current time
    const checkOutTime = customCheckOutTime
      ? new Date(customCheckOutTime)
      : new Date();

    // Validate that checkout time is after checkin time
    const checkInTime = new Date(checkin.checkInTime);

    if (checkOutTime <= checkInTime) {
      throw new BadRequestException(
        'Checkout time must be after check-in time',
      );
    }

    // Update checkin with checkout time
    await this.update(id, {
      checkOutTime,
    });

    // Get updated checkin
    const updatedCheckin = await this.getSingle(id);

    return {
      message: 'Checkin checked out successfully',
      checkin: updatedCheckin as Checkin,
    };
  }


  async deviceCheckin(
    deviceCheckinDto: any,
    query: any,
  ): Promise<any> {
    const form = Object.assign({}, deviceCheckinDto ?? {}, query ?? {});
    const timezone = query.timezone || 'UTC';
    //  macAddress for device checkin
    const macAddress = query.macAddress || form.macAddress || null;
    const location = query.location || form.location || 'Device Check-in';

    let SCode: any;
    let user: any;

    try {
      // Try to parse SCode if it's JSON
      if (typeof form.SCode === 'string') {
        try {
          SCode = JSON.parse(form.SCode);
        } catch {
          // Not JSON — treat as plain RFID
          SCode = (form.SCode || '').toString().trim();
        }
      } else {
        // Already object
        SCode = form.SCode;
      }

      // If JSON payload (QR scan)
      if (typeof SCode === 'object' && SCode.userId) {
        user = await this.usersService.getUser(SCode.userId);
      }
      // If plain RFID scan
      else if (typeof SCode === 'string') {
        const userProfile = await this.profilesService.getSingle({ rfid: SCode }, { _relations: ['user'] });
        if (!userProfile) {
          return {
            ResultCode: '0',
            ActIndex: '1',
            Audio: '04',
            Msg: `User not found`,
          };
        }
        user = userProfile.user;
      } else {
        return {
          ResultCode: '0',
          ActIndex: '1',
          Audio: '04',
          Msg: `Invalid format`,
        };
      }
    } catch (error) {
      return {
        ResultCode: '0',
        ActIndex: '1',
        Audio: '04',
        Msg: `Error processing`,
      };
    }

    if (!user) {
      console.log(`User not found`);
      return {
        ResultCode: '0',
        ActIndex: '1',
        Audio: '04',
        Msg: `User not found`,
      };
    }

    if (!user.isActive) {
      return {
        ResultCode: '0',
        ActIndex: '1',
        Audio: '04',
        Msg: `User is inactive`,
      };
    }

    const dt = DateTime.now().setZone(timezone);

    if (!dt.isValid) {
      return {
        ResultCode: '0',
        ActIndex: '1',
        Audio: '04',
        Msg: `Invalid timezone: ${timezone}`,
      };
    }

    // Convert to Date object for checkInTime/checkOutTime
    const currentDateTime = dt.toJSDate();

    try {
      // Check if user has an open check-in (no checkout time)
      // Check for checkins on the same day in the device's timezone
      const startOfDay = dt.startOf('day').toJSDate();
      const endOfDay = dt.endOf('day').toJSDate();

      const openCheckin = await this.checkinRepo
        .createQueryBuilder('checkin')
        .where('checkin.userId = :userId', { userId: user.id })
        .andWhere('checkin.checkInTime >= :startOfDay', { startOfDay })
        .andWhere('checkin.checkInTime <= :endOfDay', { endOfDay })
        .andWhere('checkin.checkOutTime IS NULL')
        .orderBy('checkin.checkInTime', 'DESC')
        .getOne();

      if (openCheckin) {
        // Perform checkout - validate checkout time is after check-in time
        const checkInTime = new Date(openCheckin.checkInTime);
        if (currentDateTime <= checkInTime) {
          return {
            ResultCode: '0',
            ActIndex: '1',
            Audio: '04',
            Msg: `Checkout time must be after check-in time`,
          };
        }

        // Update checkin with checkout time
        await this.update(openCheckin.id, {
          checkOutTime: currentDateTime,
          timezone: timezone,
        });

        return {
          ResultCode: '1',
          ActIndex: '1',
          Audio: '04',
          Msg: `checked-out`,
        };
      }

      // Otherwise, perform check-in
      // Find DeviceReader by macAddress, then find Door linked to that DeviceReader
      let door: Door | null = null;
      let deviceReader: any = null;
      
      if (macAddress) {
        try {
          // Find DeviceReader by macAddress
          deviceReader = await this.deviceReadersService.getSingle(
            { macAddress: macAddress },
            { _relations: ['door'] }
          );
          
          if (deviceReader && deviceReader.door) {
            // Get full door details with location
            door = await this.doorsService.getSingle(
              deviceReader.door.id,
              { _relations: ['location'] }
            ) as Door | null;
          }
        } catch (error) {
          // DeviceReader or Door lookup failed, but continue with checkin creation
          this.logger.warn(`Failed to find device reader with macAddress ${macAddress} or linked door: ${error.message}`);
        }
      }

      const checkinData: any = {
        user: { id: user.id } as any,
        checkInTime: currentDateTime,
        // Store macAddress in deviceId field for reference
        deviceId: macAddress,
        timezone: timezone,
      };

      // Link door if found
      if (door && door.id) {
        checkinData.door = { id: door.id } as any;
        
        // Link location from door if door has a location
        if (door.locationId) {
          checkinData.location = { id: door.locationId } as any;
        }
      }

      const newCheckin = await this.create<CreateCheckinDto>(
        checkinData,
        {
          beforeCreate: (processedData: CreateCheckinDto) => {
            return {
              ...processedData,
              user: {
                id: processedData.user.id,
              },
              ...(processedData.door?.id ? {
                door: {
                  id: processedData.door.id,
                } as any,
              } : {}),
            };
          },
        },
      );

      // Trigger Door Camera Snapshot (Non-blocking)
      // Capture tenantId before async call to preserve context
      const tenantId = RequestContext.get<string>('tenantId');
      // Pass macAddress to snapshot handler for lookup
      this.handleDoorCameraSnapshot(newCheckin.id, macAddress, tenantId).catch(err =>
        console.error(`Door camera snapshot check-in error: ${err.message}`)
      );

      return {
        ResultCode: '1',
        ActIndex: '1',
        Audio: '04',
        Msg: `checked-in`,
      };
    } catch (error) {
      return {
        ResultCode: '0',
        ActIndex: '1',
        Audio: '04',
        Msg: error.message,
      };
    }
  }

  private async handleDoorCameraSnapshot(checkinId: string, macAddress?: string | null, tenantId?: string) {
    // Preserve tenant context for async operation
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        // Get checkin to ensure it exists and get macAddress if not provided
        const checkin = await this.getSingle(checkinId);
        if (!checkin) {
          this.logger.warn(`Checkin ${checkinId} not found for snapshot`);
          return;
        }

        // Use macAddress from parameter or from checkin (stored in deviceId field)
        const checkinMacAddress = macAddress || (checkin as any).deviceId;
        
        if (!checkinMacAddress) {
          this.logger.warn(`No macAddress found for checkin ${checkinId}, skipping snapshot`);
          return;
        }

        // Find DeviceReader by macAddress
        const deviceReader = await this.deviceReadersService.getSingle(
          { macAddress: checkinMacAddress },
          { _relations: ['door'] }
        );

        if (!deviceReader || !deviceReader.door) {
          this.logger.warn(`No device reader found with macAddress ${checkinMacAddress} or no door linked to it, skipping snapshot`);
          return;
        }

        // Get door with camera relation
        const door = await this.doorsService.getSingle(deviceReader.door.id, {
          _relations: ['camera'],
        });

        if (!door || !door.camera || !door.cameraId) {
          this.logger.warn(`No camera linked to door ${door?.id || 'unknown'}, skipping snapshot`);
          return;
        }

        // Trigger camera snapshot capture - add job directly
        this.logger.log(`Triggering camera snapshot capture for checkin ${checkinId} from camera ${door.cameraId}`);
        
        const jobId = `snapshot-${checkinId}-${door.cameraId}`;
        const existingJob = await this.cameraSnapshotQueue.getJob(jobId);
        if (existingJob) {
          existingJob.remove();
        }

        await this.cameraSnapshotQueue.add('capture', { checkinId, cameraId: door.cameraId, tenantId }, { jobId });
      } catch (error) {
        this.logger.error(`Failed to handle door camera snapshot: ${error.message}`);
      }
    });
  }

}


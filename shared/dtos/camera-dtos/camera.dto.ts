import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsObject,
  IsUrl,
  Matches,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  Equals,
} from "../../decorators/crud.dto.decorators";
import { LocationDto } from "../location-dtos/location.dto";
import { ECameraProtocol } from "@shared/enums";


export class CreateCameraDto {
  @ApiProperty({
    example: 'Main Entrance Camera',
    description: 'Camera name',
  })
  @IsNotEmpty({ message: "Camera name is required" })
  @IsString()
  @FieldType("text", true)
  name: string;

  @ApiPropertyOptional({
    example: 'Main entrance camera for security monitoring',
    description: 'Camera description',
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    enum: ECameraProtocol,
    example: ECameraProtocol.RTSP,
    description: 'Camera streaming protocol',
  })
  @IsNotEmpty()
  @IsEnum(ECameraProtocol, { message: "Invalid camera protocol" })
  @FieldType("select", true)
  @FieldOptions([
    { value: ECameraProtocol.RTSP, label: 'RTSP' },
    { value: ECameraProtocol.RTMP, label: 'RTMP' },
    { value: ECameraProtocol.SRT, label: 'SRT' },
    { value: ECameraProtocol.HLS, label: 'HLS' },
    { value: ECameraProtocol.HTTP_MJPEG, label: 'HTTP MJPEG' },
  ])
  protocol: ECameraProtocol;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Username for camera authentication',
  })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  username?: string;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'Password for camera authentication',
  })
  @IsOptional()
  @IsString()
  @FieldType("password", false)
  password?: string;

  @ApiPropertyOptional({
    example: '192.168.1.100',
    description: 'Camera IP address',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}$/, { message: "Invalid IP address format" })
  @FieldType("text", false)
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 554,
    description: 'Camera port',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  @FieldType("number", false)
  port?: number;

  @ApiPropertyOptional({
    example: '/stream',
    description: 'Camera stream path',
  })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  path?: string;

  @ApiProperty({
    type: LocationDto,
    description: "Location that this camera belongs to",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  @FieldType("nested", true, LocationDto)
  location: LocationDto;

  @ApiProperty({
    example: true,
    description: 'Whether the camera stream is active',
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("checkbox", false)
  isActive?: boolean;
}

export class UpdateCameraDto extends PartialType(CreateCameraDto) { }

export class CameraListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by location ID",
  })
  @IsOptional()
  @IsString()
  @Equals()
  locationId?: string;

  @ApiPropertyOptional({
    description: "Filter by active status",
  })
  @IsOptional()
  @IsBoolean()
  @Equals()
  isActive?: boolean;
}

export class CameraPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [CameraDto] })
  @Type(() => CameraDto)
  data: CameraDto[];
}

export class CameraDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Camera ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({
    example: 'Main Entrance Camera',
    description: 'Camera name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Main entrance camera for security monitoring',
    description: 'Camera description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ECameraProtocol,
    example: ECameraProtocol.RTSP,
    description: 'Camera streaming protocol',
  })
  @IsOptional()
  @IsEnum(ECameraProtocol)
  protocol?: ECameraProtocol;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Username for camera authentication',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    example: '192.168.1.100',
    description: 'Camera IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 554,
    description: 'Camera port',
  })
  @IsOptional()
  @IsNumber()
  port?: number;

  @ApiPropertyOptional({
    example: '/stream',
    description: 'Camera stream path',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    example: 'rtsp://192.168.1.100:554/stream',
    description: 'Camera stream URL (generated from protocol, ip, port, and path)',
  })
  @IsOptional()
  @IsString()
  streamUrl?: string;

  @ApiProperty({
    type: LocationDto,
    description: "Location that this camera belongs to",
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty({
    example: true,
    description: 'Whether the camera stream is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;


  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Expose } from "class-transformer";
import { IsOptional, IsString, IsEnum } from "class-validator";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { EConnectionType, EConnectionStatus, EDatabaseMode } from "../../enums/database.enum";

export class DatabaseConnectionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Connection ID",
  })
  id: string;

  @ApiProperty({
    example: "main",
    description: "Unique connection name identifier",
  })
  connectionName: string;

  @ApiProperty({
    enum: EConnectionType,
    example: EConnectionType.MAIN,
    description: "Type of database connection",
  })
  connectionType: EConnectionType;

  @ApiProperty({
    enum: EDatabaseMode,
    example: EDatabaseMode.SINGLE,
    description: "Database mode for this connection",
  })
  databaseMode: EDatabaseMode;

  @ApiProperty({
    example: "localhost",
    description: "Database host",
  })
  host: string;

  @ApiProperty({
    example: 5432,
    description: "Database port",
  })
  port: number;

  @ApiProperty({
    example: "my_database",
    description: "Database name",
  })
  database: string;

  @ApiPropertyOptional({
    example: "tenant_123",
    description: "Schema name (for multi-schema mode)",
  })
  schema?: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Tenant ID (for tenant-specific connections)",
  })
  tenantId?: string;

  @ApiProperty({
    enum: EConnectionStatus,
    example: EConnectionStatus.READY,
    description: "Current status of the connection",
  })
  status: EConnectionStatus;

  @ApiPropertyOptional({
    example: "Connection initialized successfully",
    description: "Status message or error description",
  })
  statusMessage?: string;

  @ApiPropertyOptional({
    example: "2024-01-15T10:30:00.000Z",
    description: "Last time connection was checked",
  })
  lastCheckedAt?: Date;

  @ApiPropertyOptional({
    example: "2024-01-15T10:30:00.000Z",
    description: "Last time connection was successfully connected",
  })
  lastConnectedAt?: Date;

  @ApiProperty({
    example: "2024-01-15T10:30:00.000Z",
    description: "Creation date",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2024-01-15T10:30:00.000Z",
    description: "Last update date",
  })
  updatedAt: Date;
}

export class DatabaseConnectionPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [DatabaseConnectionDto] })
  @Expose()
  @Type(() => DatabaseConnectionDto)
  data: DatabaseConnectionDto[];
}

export class DatabaseConnectionListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EConnectionType,
    description: "Filter by connection type",
  })
  @IsOptional()
  @IsEnum(EConnectionType)
  connectionType?: EConnectionType;

  @ApiPropertyOptional({
    enum: EConnectionStatus,
    description: "Filter by connection status",
  })
  @IsOptional()
  @IsEnum(EConnectionStatus)
  status?: EConnectionStatus;

  @ApiPropertyOptional({
    enum: EDatabaseMode,
    description: "Filter by database mode",
  })
  @IsOptional()
  @IsEnum(EDatabaseMode)
  databaseMode?: EDatabaseMode;

  @ApiPropertyOptional({
    description: "Filter by tenant ID",
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

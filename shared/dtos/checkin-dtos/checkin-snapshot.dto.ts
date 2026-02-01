import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { FileUploadDto } from "../file-upload-dtos/file-upload.dto";

export class CheckinSnapshotDto {
    @ApiProperty({
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Snapshot ID",
    })
    @IsNotEmpty()
    @IsString()
    id: string;

    @ApiProperty({
        example: 1,
        description: "Sequence number of the snapshot (1, 2, or 3)",
    })
    @IsNotEmpty()
    @IsNumber()
    sequence: number;

    @ApiPropertyOptional({
        description: "File entity for the uploaded snapshot image",
        type: () => FileUploadDto,
    })
    @IsOptional()
    @Type(() => FileUploadDto)
    image?: FileUploadDto | null;

    @IsOptional()
    createdAt?: string;

    @IsOptional()
    updatedAt?: string;
}

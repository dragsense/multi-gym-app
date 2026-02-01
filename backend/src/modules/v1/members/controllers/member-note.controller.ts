import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemberNote } from '../entities/member-note.entity';
import {
  CreateMemberNoteDto,
  UpdateMemberNoteDto,
  MemberNoteListDto,
  MemberNoteDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { MemberNoteService } from '../services/member-note.service';

@ApiBearerAuth('access-token')
@ApiTags('Member Notes')
@MinUserLevel(EUserLevels.STAFF)
@Controller('member-notes')
export class MemberNoteController {
  constructor(private readonly memberNoteService: MemberNoteService) {}

  @ApiOperation({ summary: 'Create a new member note' })
  @ApiResponse({
    status: 201,
    description: 'Member note created successfully',
    type: MemberNoteDto,
  })
  @Post()
  create(@Body() createDto: CreateMemberNoteDto) {
    return this.memberNoteService.create(createDto);
  }

  @ApiOperation({ summary: 'Get all member notes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of member notes',
  })
  @Get()
  findAll(@Query() query: MemberNoteListDto) {
    return this.memberNoteService.get(query, MemberNoteListDto, {
      beforeQuery: (queryBuilder: any) => {
        if (query.memberId) {
          queryBuilder.andWhere('entity.memberId = :memberId', {
            memberId: query.memberId,
          });
        }
        return queryBuilder;
      },
    });
  }

  @ApiOperation({ summary: 'Get a member note by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the member note',
    type: MemberNoteDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberNoteService.getSingle(id);
  }

  @ApiOperation({ summary: 'Update a member note' })
  @ApiResponse({
    status: 200,
    description: 'Member note updated successfully',
    type: MemberNoteDto,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateMemberNoteDto) {
    return this.memberNoteService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a member note' })
  @ApiResponse({
    status: 200,
    description: 'Member note deleted successfully',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberNoteService.delete(id);
  }
}


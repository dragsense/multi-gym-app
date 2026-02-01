import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { StaffService } from './staff.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffListDto,
  StaffPaginatedDto,
  StaffDto,
  UserDto,
  SingleQueryDto,
} from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Staff')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.STAFF)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiOperation({ summary: 'Get all staff members with pagination and filters' })
  @ApiResponse({ status: 200, type: StaffPaginatedDto })
  @Get()
  findAll(@Query() query: StaffListDto) {
    return this.staffService.get(query, StaffListDto);
  }

  @ApiOperation({ summary: 'Get current user staff profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns staff if exists, null otherwise',
    type: StaffDto,
  })
  @Get('me')
    getCurrentUserStaff(
    @Query() query: SingleQueryDto,
    @AuthUser() currentUser: User,
  ) {
    return this.staffService.getCurrentUserStaff(currentUser, query);
  }

  @ApiOperation({ summary: 'Get a single staff member by ID' })
  @ApiParam({ name: 'id', description: 'Staff member ID (User ID)' })
  @ApiResponse({ status: 200, type: UserDto })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto
  ) {
    return this.staffService.getSingle(id, query);
  }

  @ApiOperation({ summary: 'Create a new staff member' })
  @ApiResponse({ status: 201, type: UserDto })
  @Post()
  create(
    @Body() createStaffDto: CreateStaffDto,
    @AuthUser() currentUser: User,
  ) {
    return this.staffService.createStaff(createStaffDto);
  }

  @ApiOperation({ summary: 'Update an existing staff member' })
  @ApiParam({ name: 'id', description: 'Staff member ID (User ID)' })
  @ApiResponse({ status: 200, type: UserDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(id, updateStaffDto);
  }

  @ApiOperation({ summary: 'Delete a staff member' })
  @ApiParam({ name: 'id', description: 'Staff member ID (User ID)' })
  @ApiResponse({ status: 200, type: Object, description: 'Staff member deleted successfully' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }
}

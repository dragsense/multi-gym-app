import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionsService } from './services/permissions.service';
import { ResourcesService } from './services/resources.service';
import {
  RoleListDto,
  RoleDto,
  RolePaginatedDto,
  CreateRoleDto,
  UpdateRoleDto,
  PermissionListDto,
  PermissionDto,
  PermissionPaginatedDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  ResourceListDto,
  ResourceDto,
  ResourcePaginatedDto,
  UpdateResourceDto,
} from '@shared/dtos/role-dtos';
import { RequireModule } from '@/decorators/require-module.decorator';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiTags('Roles & Permissions')
@RequireModule(ESubscriptionFeatures.ROLES)
@Controller('roles')
@MinUserLevel(EUserLevels.ADMIN)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionService: PermissionsService,
    private readonly resourceService: ResourcesService,
  ) {}

  // Role endpoints
  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination and filtering' })
  @ApiQuery({ type: RoleListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of roles',
    type: RolePaginatedDto,
  })
  async findAll(@Query() queryDto: RoleListDto) {
    return await this.rolesService.get(queryDto, RoleListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findRole(@Param('id') id: string) {
    return await this.rolesService.getSingle(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleDto,
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.createRole(createRoleDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.rolesService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async deleteRole(@Param('id') id: string) {
    await this.rolesService.delete(id);
    return { message: 'Role deleted successfully' };
  }

  // Permission endpoints
  @Get('system/permissions')
  @ApiOperation({
    summary: 'Get all permissions with pagination and filtering',
  })
  @ApiQuery({ type: PermissionListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of permissions',
    type: PermissionPaginatedDto,
  })
  async findAllPermissions(@Query() queryDto: PermissionListDto) {
    return await this.permissionService.get(queryDto);
  }

  @Get('system/permissions/:id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: PermissionDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findPermission(@Param('id') id: string, @Query() queryDto: SingleQueryDto) {
    return await this.permissionService.getSingle(id, queryDto);
  }

  @Get('system/:roleId/permissions')
  @ApiOperation({ summary: 'Get permissions by role ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiQuery({ type: PermissionListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of permissions for the role',
    type: PermissionPaginatedDto,
  })
  async findPermissionsByRole(
    @Param('roleId') roleId: string,
    @Query() queryDto: PermissionListDto,
  ) {
    return await this.permissionService.get(
      {
        ...queryDto,
        roleId,
        _relations: [...(queryDto._relations || []), 'role'],
      },
      PermissionListDto,
    );
  }

  @Post('system/permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: PermissionDto,
  })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionService.create(createPermissionDto);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: PermissionDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionService.update(id, updatePermissionDto);
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async deletePermission(@Param('id') id: string) {
    await this.permissionService.delete(id);
    return { message: 'Permission deleted successfully' };
  }

  // Resource endpoints
  @Get('system/resources')
  @ApiOperation({ summary: 'Get all resources with pagination and filtering' })
  @ApiQuery({ type: ResourceListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of resources',
    type: ResourcePaginatedDto,
  })
  async findAllResources(@Query() queryDto: ResourceListDto) {
    return await this.resourceService.get(queryDto, ResourceListDto);
  }

  @Get('system/resources/:id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({
    status: 200,
    description: 'Resource retrieved successfully',
    type: ResourceDto,
  })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findResource(@Param('id') id: string) {
    return await this.resourceService.getSingle(id);
  }

  @Patch('system/resources/:id')
  @ApiOperation({ summary: 'Update resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({
    status: 200,
    description: 'Resource updated successfully',
    type: ResourceDto,
  })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async updateResource(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return await this.resourceService.update(id, updateResourceDto);
  }
}

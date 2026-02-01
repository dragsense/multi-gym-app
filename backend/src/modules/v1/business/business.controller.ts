import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { BusinessService } from './business.service';
import {
    CreateBusinessDto,
    CreateBusinessWithUserDto,
    UpdateBusinessDto,
    UpdateBusinessWithUserDto,
    BusinessDto,
    BusinessPaginatedDto,
    BusinessListDto,
    SingleQueryDto,
    BusinessImpersonateResponseDto,
} from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import { Business } from './entities/business.entity';

@ApiTags('Business')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('business')
export class BusinessController {
    constructor(private readonly businessService: BusinessService) { }

    @ApiOperation({
        summary: 'Get all Business with pagination and filters',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated list of Business',
        type: BusinessPaginatedDto,
    })
    @Get()
    findAll(@Query() query: BusinessListDto) {
        return this.businessService.get(query, BusinessListDto);
    }

    @ApiOperation({ summary: 'Check if current user has a business' })
    @ApiResponse({
        status: 200,
        description: 'Returns business if exists, null otherwise',
        type: BusinessDto,
    })
    @Get('me')
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @SkipBusinessCheck()
    async getMyBusiness(@AuthUser() currentUser: User) {
     return this.businessService.getMyBusiness(currentUser);     
    }

    @ApiOperation({ summary: 'Get a Business by ID' })
    @ApiParam({ name: 'id', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns Business',
        type: BusinessDto,
    })
    @ApiResponse({ status: 404, description: 'Business not found' })
    @Get(':id')
    findOne(@Param('id') id: string, @Query() query: SingleQueryDto<Business>) {
        return this.businessService.getSingle(id, query);
    }

    @ApiOperation({ summary: 'Create a new Business' })
    @ApiBody({ type: CreateBusinessDto, description: 'Business details' })
    @ApiResponse({
        status: 201,
        description: 'Business created successfully',
    })
    @Post()
    @SkipBusinessCheck()
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    create(
        @Body() createDto: CreateBusinessDto,
        @AuthUser() currentUser: User,
        @Timezone() timezone: string,
    ) {
        return this.businessService.createBusiness(createDto, currentUser);
    }

    @ApiOperation({ summary: 'Create a new Business with User' })
    @ApiBody({ type: CreateBusinessWithUserDto, description: 'Business and user details' })
    @ApiResponse({
        status: 201,
        description: 'Business and user created successfully',
    })
    @Post('with-user')
    @SkipBusinessCheck()
    createWithUser(
        @Body() createDto: CreateBusinessWithUserDto,
    ) {
        return this.businessService.createBusinessWithUser(createDto);
    }

    @ApiOperation({ summary: 'Update a Business plan by ID' })
    @ApiParam({ name: 'id', description: 'Business ID' })
    @ApiBody({
        type: UpdateBusinessDto,
        description: 'Updated Business details',
    })
    @ApiResponse({
        status: 200,
        description: 'Business updated successfully',
    })
    @ApiResponse({ status: 404, description: 'Business not found' })
    @Patch(':id')
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @SkipBusinessCheck()
    update(@Param('id') id: string, @Body() updateDto: UpdateBusinessDto) {
        return this.businessService.update(id, updateDto);
    }

    @ApiOperation({ summary: 'Update a Business with User by ID' })
    @ApiParam({ name: 'id', description: 'Business ID' })
    @ApiBody({
        type: UpdateBusinessWithUserDto,
        description: 'Updated Business and user details',
    })
    @ApiResponse({
        status: 200,
        description: 'Business and user updated successfully',
    })
    @ApiResponse({ status: 404, description: 'Business not found' })
    @Post(':id/with-user')
    @SkipBusinessCheck()
    updateWithUser(
        @Param('id') id: string,
        @Body() updateDto: UpdateBusinessWithUserDto,
    ) {
        return this.businessService.updateBusinessWithUser(id, updateDto);
    }

    @ApiOperation({ summary: 'Delete a Business plan by ID' })
    @ApiParam({ name: 'id', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Business deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Business not found' })
    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.businessService.delete(id);
    }

    @ApiOperation({ 
        summary: 'Login to current user\'s business',
        description: 'Gets the current user\'s business and generates a redirect URL to login to the business portal'
    })
    @ApiResponse({
        status: 200,
        description: 'Returns redirect URL with login token',
        type: BusinessImpersonateResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Business not found for current user' })
    @ApiResponse({ status: 400, description: 'Business does not have tenant database or subdomain' })
    @Post('login')
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    async loginToMyBusiness(
        @AuthUser() currentUser: User,
    ): Promise<BusinessImpersonateResponseDto> {
        return this.businessService.loginToMyBusiness(currentUser);
    }

    @ApiOperation({ 
        summary: 'Login to business as admin (impersonation)',
        description: 'Generates a short-lived token to login to a business subdomain as the super admin user'
    })
    @ApiParam({ name: 'id', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns redirect URL with impersonation token',
        type: BusinessImpersonateResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Business not found' })
    @ApiResponse({ status: 400, description: 'Business does not have tenant database or subdomain' })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Post(':id/login-as')
    async loginToBusiness(
        @Param('id') id: string,
        @AuthUser() currentUser: User,
    ): Promise<BusinessImpersonateResponseDto> {
        return this.businessService.loginToBusiness(id, currentUser);
    }
}

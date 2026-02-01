import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { Business } from './entities/business.entity';

import { CreateBusinessDto, CreateBusinessWithUserDto, UpdateBusinessWithUserDto, BusinessImpersonateResponseDto } from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { EBusinessStatus } from '@shared/enums/business/business.enum';
import { EUserLevels } from '@shared/enums';
import { DatabaseManager } from '@/common/database/database-manager.service';
import { TokenService } from '@/modules/v1/auth/services/tokens.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { IMessageResponse } from '@shared/interfaces';

@Injectable()
export class BusinessService extends CrudService<Business> {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepo: Repository<Business>,
        moduleRef: ModuleRef,
        private readonly databaseManager: DatabaseManager,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        const crudOptions: CrudOptions = {
            restrictedFields: [],
            searchableFields: ['businessName'],
        };
        super(businessRepo, moduleRef, crudOptions);
    }

    getRepository(): Repository<Business> {
        return this.businessRepo;
      }

    async createBusiness(createDto: CreateBusinessDto, currentUser: User): Promise<Business> {
        return this.create(createDto, {
            beforeCreate: async (dto, manager) => {
                const business = await manager.findOne(Business, {
                    where: { user: { id: currentUser.id } },
                });

                if (business) {
                    throw new BadRequestException('You already have a business.');
                }

                // Generate unique tenantId
                const tenantId = randomUUID();

                return {
                    ...dto,
                    user: currentUser,
                    tenantId,
                };
            }
        });
    }

    async createBusinessWithUser(
        createDto: CreateBusinessWithUserDto,
    ): Promise<IMessageResponse & { business: Business }> {
        const { user, ...businessData } = createDto;

        // Check if business with same subdomain exists
        const existingBusiness = await this.businessRepo.findOne({
            where: { subdomain: businessData.subdomain },
        });

        if (existingBusiness) {
            throw new BadRequestException('Business with this subdomain already exists');
        }

        const savedBusiness = await this.create(
            {
                ...businessData,
            },
            {
                beforeCreate: async (dto, manager) => {
                    // Generate unique tenantId
                    const tenantId = randomUUID();

                    return {
                        ...dto,
                        tenantId,
                    };
                },
                afterCreate: async (savedEntity, manager) => {
                    try {
                        // Create user with SUPER_ADMIN level for business owner
                        const savedUser = await this.usersService.createUser({
                            ...user,
                            level: EUserLevels.SUPER_ADMIN,
                        });

                        // Update business with created user
                        await manager.update(Business, savedEntity.id, {
                            user: savedUser.user,
                        });

                        savedEntity.user = savedUser.user;
                    } catch (error) {
                        throw new BadRequestException(
                            `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        );
                    }
                },
            },
        );

        return {
            message: 'Business created successfully',
            business: savedBusiness,
        };
    }

    async updateBusinessWithUser(
        id: string,
        updateDto: UpdateBusinessWithUserDto,
    ): Promise<IMessageResponse & { business: Business }> {
        const { user, ...businessData } = updateDto;

        // Check if business exists
        const existingBusiness = await this.getSingle(id, {
            _relations: ['user'],
        });

        if (!existingBusiness) {
            throw new NotFoundException('Business not found');
        }

        // Update business
        const updatedBusiness = await this.update(id, businessData, {
            afterUpdate: async (savedEntity) => {
                try {
                    // Update user if provided
                    if (user && existingBusiness.user) {
                        await this.usersService.updateUser(
                            existingBusiness.user.id,
                            user,
                        );
                    }
                } catch (error) {
                    throw new BadRequestException(
                        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
            },
        });

        return {
            message: 'Business updated successfully',
            business: updatedBusiness,
        };
    }

    /**
     * Find business by subdomain
     * @param subdomain - The subdomain to search for (e.g., 'mygym' from 'mygym.example.com')
     * @returns Business entity if found, null otherwise
     */
    async findBySubdomain(subdomain: string): Promise<Business | null> {
        if (!subdomain) {
            return null;
        }
        const repository = this.getRepository();
        return repository.findOne({
            where: { subdomain: subdomain.toLowerCase() },
        });
    }

    /**
     * Login to business as admin (impersonation)
     * @param businessId - The business ID to login to
     * @param adminUser - The admin user performing the impersonation
     * @returns Impersonation response with redirect URL and token
     */
    async loginToBusiness(businessId: string, adminUser: User): Promise<BusinessImpersonateResponseDto> {
        // 1. Get business with user relation
        const business = await this.getSingle(businessId, {
            _relations: ['user'],
        });

        if (!business) {
            throw new NotFoundException('Business not found');
        }

        if (!business.tenantId) {
            throw new BadRequestException('Business does not have a tenant database');
        }

        if (!business.subdomain) {
            throw new BadRequestException('Business does not have a subdomain configured');
        }

        // 2. Get the business owner user
        const businessUser = business.user;
        if (!businessUser) {
            throw new NotFoundException('Business owner user not found');
        }

        // 3. Switch to tenant database and find the super admin user
        const tenantUserRepo = this.databaseManager.getRepository<User>(
            User,
            { tenantId: business.tenantId }
        );

        // Find user in tenant DB where refUserId matches business owner and level is SUPER_ADMIN
        const tenantSuperAdmin = await tenantUserRepo.findOne({
            where: {
                refUserId: businessUser.id,
                level: EUserLevels.SUPER_ADMIN,
            },
        });

        if (!tenantSuperAdmin) {
            throw new NotFoundException('Super admin user not found in tenant database');
        }

        // 4. Generate short-lived impersonation token (60 seconds)
        const impersonationToken = this.tokenService.generateImpersonationToken({
            userId: adminUser.id,
            tenantId: business.tenantId,
            targetUserId: tenantSuperAdmin.id,
            subdomain: business.subdomain,
            purpose: 'impersonation',
        }, '60s');

        // 5. Build redirect URL
        const host = this.configService.get('app.host') || 'localhost';
        const port = process.env.SUBDOMAIN_PORT || '5173';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const redirectUrl = `${protocol}://${business.subdomain}.${host}:${port}/auth/impersonate?token=${impersonationToken}`;

        return {
            redirectUrl,
            token: impersonationToken,
            subdomain: business.subdomain,
        };
    }

    /**
     * Login to current user's business
     * @param currentUser - The current authenticated user
     * @returns Redirect URL to business portal
     */
    async loginToMyBusiness(currentUser: User): Promise<BusinessImpersonateResponseDto> {
        // 1. Get business from current user
        const business = await this.getRepository().findOne({
            where: { user: { id: currentUser.id } },
            relations: ['user'],
        });

        if (!business) {
            throw new NotFoundException('Business not found for current user');
        }

        if (!business.tenantId) {
            throw new BadRequestException('Business does not have a tenant database');
        }

        if (!business.subdomain) {
            throw new BadRequestException('Business does not have a subdomain configured');
        }

        // 2. Switch to tenant database and find the user
        const tenantUserRepo = this.databaseManager.getRepository<User>(
            User,
            { tenantId: business.tenantId }
        );

        // Find user in tenant DB where refUserId matches current user
        const tenantUser = await tenantUserRepo.findOne({
            where: {
                refUserId: currentUser.id,
            },
        });

        if (!tenantUser) {
            throw new NotFoundException('User not found in tenant database');
        }

        // 3. Generate short-lived login token (60 seconds)
        const loginToken = this.tokenService.generateImpersonationToken({
            userId: currentUser.id,
            tenantId: business.tenantId,
            targetUserId: tenantUser.id,
            subdomain: business.subdomain,
            purpose: 'my-business-login',
        }, '60s');

        // 4. Build redirect URL
        const host = this.configService.get('app.host') || 'localhost';
        const port = process.env.SUBDOMAIN_PORT || '5173';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const redirectUrl = `${protocol}://${business.subdomain}.${host}:${port}/auth/impersonate?token=${loginToken}`;

        return {
            redirectUrl,
            token: loginToken,
            subdomain: business.subdomain,
        };
    }

    async getMyBusiness(currentUser: User): Promise<Business> {
        let business = await this.getSingle({ userId: currentUser.id });

        if (!business) {
            if(currentUser.refUserId) 
            business = await this.getSingle({ userId: currentUser.refUserId }, { _relations: ['user'] });

            if (!business) {
                throw new NotFoundException('Business not found for current user');
            }
        }

        return business;
    }
}

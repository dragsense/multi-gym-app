import { BadRequestException, Injectable, NotFoundException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { CrudService } from '@/common/crud/crud.service';
import { CrudMethodConfig, CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { Business } from './entities/business.entity';

import { CreateBusinessDto, CreateBusinessWithUserDto, UpdateBusinessDto, UpdateBusinessWithUserDto, BusinessImpersonateResponseDto } from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { PaymentProcessorsService } from '@/common/payment-processors/payment-processors.service';
import { AIProcessorsService } from '@/common/ai-processors/ai-processors.service';
import { EBusinessStatus } from '@shared/enums/business/business.enum';
import { EPaymentProcessorType, EUserLevels } from '@shared/enums';
import { DatabaseManager } from '@/common/database/database-manager.service';
import { TokenService } from '@/modules/v1/auth/services/tokens.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { IMessageResponse } from '@shared/interfaces';
import { BusinessSubscriptionService } from './services/business-subscription.service';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { APP_MODE } from '@/config/app.config';

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
        private readonly paymentProcessorsService: PaymentProcessorsService,
        @Inject(forwardRef(() => BusinessSubscriptionService))
        private readonly businessSubscriptionService: BusinessSubscriptionService,
        private readonly baseUsersService: BaseUsersService,
        private readonly aiProcessorsService: AIProcessorsService,
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
        /*  if (createDto.paymentProcessorId) {
             await this.validatePaymentProcessorId(createDto.paymentProcessorId);
         } else {
             const paymentProcessor = await this.paymentProcessorsService.getSingle({
                 type: EPaymentProcessorType.CASH,
             });
             createDto.paymentProcessorId = paymentProcessor?.id;
         } */

        const paymentProcessor = await this.paymentProcessorsService.getSingle({
            type: EPaymentProcessorType.STRIPE,
        });


        const savedBusiness = await this.create({ ...createDto, paymentProcessor: { id: paymentProcessor?.id } }, {
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
            },
            afterCreate: async (savedEntity, manager) => {
            },
        });

        this.businessSubscriptionService.activateBusiness(savedBusiness.id).then(() => {
            this.logger.log(`Business subscription activated for business ${savedBusiness.id}`);
        }).catch((error) => {
            this.logger.error(`Failed to activate business subscription for business ${savedBusiness.id}: ${error.message}`);
        });

        return savedBusiness;

    }

    async createBusinessWithUser(
        createDto: CreateBusinessWithUserDto,
    ): Promise<IMessageResponse & { business: Business }> {
        const { user, ...businessData } = createDto;

        /*   if (createDto.paymentProcessorId) {
              await this.validatePaymentProcessorId(createDto.paymentProcessorId);
          }  */

        const paymentProcessor = await this.paymentProcessorsService.getSingle({
            type: EPaymentProcessorType.STRIPE,
        });

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
                paymentProcessor: { id: paymentProcessor?.id }
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


        this.businessSubscriptionService.activateBusiness(savedBusiness.id).then(() => {
            this.logger.log(`Business subscription activated for business ${savedBusiness.id}`);
        }).catch((error) => {
            this.logger.error(`Failed to activate business subscription for business ${savedBusiness.id}: ${error.message}`);
        });

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
     * Validate that paymentProcessorId exists and is enabled when provided.
     */
    private async validatePaymentProcessorId(paymentProcessorId: string): Promise<void> {
        const processor = await this.paymentProcessorsService.getSingle(paymentProcessorId);
        if (!processor) {
            throw new BadRequestException('Payment processor not found');
        }
        if (!processor.enabled) {
            throw new BadRequestException('Selected payment processor is not enabled');
        }
    }

    /**
     * Validate that aiProcessorId exists and is enabled when provided.
     */
    private async validateAIProcessorId(aiProcessorId: string): Promise<void> {
        const processor = await this.aiProcessorsService.getSingle(aiProcessorId);
        if (!processor) {
            throw new BadRequestException('AI processor not found');
        }
        if (!processor.enabled) {
            throw new BadRequestException('Selected AI processor is not enabled');
        }
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


        return this.generateBusinessLoginUrl(business, adminUser)

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

        return this.generateBusinessLoginUrl(business, currentUser)

    }

    async generateBusinessLoginUrl(business: Business | null, currentUser: User): Promise<BusinessImpersonateResponseDto> {

        if (!business) {
            throw new NotFoundException('Business not found for current user');
        }

        if (!business.tenantId) {
            throw new BadRequestException('Business does not have a tenant database');
        }

        const appMode = this.configService.get('app.appMode');
        const isMultiDomain = appMode === APP_MODE.MULTI_DOMAIN_TENANT;

        if (!business.subdomain && isMultiDomain) {
            throw new BadRequestException('Business does not have a subdomain configured');
        }

        // 2. Switch to tenant database and find the user
        const tenantUserRepo = this.databaseManager.getRepository<User>(
            User,
            { tenantId: business.tenantId }
        );

        // Find user in tenant DB where refUserId matches current user
        let tenantUser = await tenantUserRepo.findOne({
            where: {
                refUserId: currentUser.id,
            },
        });


        if (!tenantUser) {
            const user = await this.baseUsersService.getUserByIdWithPassword(business.user.id);

            const newUser = tenantUserRepo.create({
                firstName: user?.firstName || business.user.firstName,
                lastName: user?.lastName || business.user.lastName,
                email: user?.email || business.user.email,
                password: user?.password,
                isActive: true,
                isVerified: true,
                level: EUserLevels.ADMIN,
                refUserId: user?.id || business.user.id || undefined,
            });
            tenantUser = await tenantUserRepo.save(newUser) as User;
        }

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
        const port = process.env.NODE_ENV === 'development' ? (process.env.SUBDOMAIN_PORT || '5173') : '';
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const redirectUrl = `${protocol}://${isMultiDomain ? `${business.subdomain}.` : 'impersonate.'}${host}${port ? `:${port}` : ''}/auth/impersonate?token=${loginToken}&tenantId=${business.tenantId}`;




        return {
            tenantId: business.tenantId,
            redirectUrl,
            token: loginToken,
            subdomain: business.subdomain,
        };
    }

    async getMyBusiness(currentUser: User): Promise<Business> {
        const relations = { _relations: ['paymentProcessor'] };
        let business = await this.getSingle({ userId: currentUser.id }, relations, undefined, undefined, {
            skipTenantScope: true,
            skipSuperAdminOwnDataOnly: true,
        });

        if (!business) {
            if (currentUser.refUserId) {
                business = await this.getSingle(
                    { userId: currentUser.refUserId },
                    { _relations: ['user', 'paymentProcessor'] },
                );
            }
            if (!business) {
                throw new NotFoundException('Business not found for current user');
            }
        }

        return business;
    }

    /**
     * Returns current user's business payment processor type for payment UI (Stripe vs Paysafe).
     * Skips business lookup when user level is MEMBER (members have no business).
     */
    async getMyBusinessPaymentProcessorType(currentUser: User): Promise<{ type: string | null; paymentProcessorId: string | null }> {

        try {
            const business = await this.getMyBusiness(currentUser);
            const type = business.paymentProcessor?.type ?? null;
            return { type, paymentProcessorId: business.paymentProcessorId ?? null };
        } catch {
            return { type: null, paymentProcessorId: null };
        }
    }


    /**
   * Returns current user's business payment processor type for payment UI (Stripe vs Paysafe).
   * Skips business lookup when user level is MEMBER (members have no business).
   */
    async getCurrentBusinessPaymentProcessorType(tenantId: string): Promise<{ type: string | null; paymentProcessorId: string | null }> {

        const business = await this.getSingle({ tenantId }, { _relations: ['paymentProcessor'] });

        if (!business) {
            throw new NotFoundException('Business not found for tenant');
        }

        const type = business.paymentProcessor?.type ?? null;
        return { type, paymentProcessorId: business.paymentProcessorId ?? null };
    }

    /**
     * Update the current user's own business (e.g. payment processor during onboarding).
     * Only allows updating safe fields like paymentProcessorId.
     */
    async updateMyBusiness(
        currentUser: User,
        updateDto: UpdateBusinessDto,
    ): Promise<Business> {
        const business = await this.getMyBusiness(currentUser);
        const allowedData: Partial<UpdateBusinessDto> = {};
        /*     if (updateDto.paymentProcessorId !== undefined) {
                allowedData.paymentProcessorId = updateDto.paymentProcessorId;
            }
            if (updateDto.aiProcessorId !== undefined) {
                allowedData.aiProcessorId = updateDto.aiProcessorId;
            }
            if (updateDto.defaultAiModel !== undefined) {
                allowedData.defaultAiModel = updateDto.defaultAiModel;
            }
            if (Object.keys(allowedData).length === 0) {
                return business;
            }
            if (allowedData.paymentProcessorId) {
                await this.validatePaymentProcessorId(allowedData.paymentProcessorId);
            } */
        await this.update(business.id, allowedData);
        return this.getSingle(business.id) as Promise<Business>;
    }

    /**
     * Override update to validate paymentProcessorId when present.
     */
    async update<TUpdateDto>(
        key: string | number | Record<string, any>,
        updateDto: TUpdateDto,
        callbacks?: {
            beforeUpdate?: (processedData: TUpdateDto, existingEntity: Business, manager: any) => any | Promise<any>;
            afterUpdate?: (updatedEntity: Business, manager: any) => any | Promise<any>;
        },
        config?: CrudMethodConfig,
    ): Promise<Business> {
        const dto = updateDto as Record<string, unknown>;
        if (dto?.paymentProcessorId && typeof dto.paymentProcessorId === 'string') {
            await this.validatePaymentProcessorId(dto.paymentProcessorId);
        }
        if (dto?.aiProcessorId && typeof dto.aiProcessorId === 'string') {
            await this.validateAIProcessorId(dto.aiProcessorId);
        }
        return super.update(key, updateDto, callbacks, config);
    }
}

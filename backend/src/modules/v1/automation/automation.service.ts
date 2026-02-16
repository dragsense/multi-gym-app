import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { Automation } from './entities/automation.entity';
import {
    CreateAutomationDto,
    UpdateAutomationDto,
} from '@shared/dtos/automation-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EmailTemplateService } from '../cms/services/email-template.service';
import { EAutomationStatus } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class AutomationService extends CrudService<Automation> {
    constructor(
        @InjectRepository(Automation)
        private readonly automationRepo: Repository<Automation>,
        private readonly emailTemplateService: EmailTemplateService,
        moduleRef: ModuleRef,
    ) {
        const crudOptions: CrudOptions = {
            restrictedFields: [],
            searchableFields: ['name'],
        };
        super(automationRepo, moduleRef, crudOptions);
    }

    async createAutomation(
        createAutomationDto: CreateAutomationDto,
    ): Promise<IMessageResponse & { automation: Automation }> {
        // Validate email template exists
        if (!createAutomationDto.emailTemplate?.id) {
            throw new BadRequestException('Email template is required');
        }

        const emailTemplate = await this.emailTemplateService.getSingle(
            createAutomationDto.emailTemplate.id,
        );
        if (!emailTemplate) {
            throw new NotFoundException('Email template not found');
        }

        // Use CRUD service create method
        const automation = await this.create<CreateAutomationDto>(
            createAutomationDto,
            {
                beforeCreate: (processedData: CreateAutomationDto) => {
                    return {
                        ...processedData,
                        emailTemplate: {
                            id: emailTemplate.id,
                        },
                        isActive: processedData.status === EAutomationStatus.ACTIVE,
                    };
                },
            },
        );

        return { message: 'Automation created successfully.', automation };
    }

    async updateAutomation(
        id: string,
        updateAutomationDto: UpdateAutomationDto,
    ): Promise<IMessageResponse> {
        const existingAutomation = await this.getSingle(id, { _relations: ['emailTemplate'] });
        if (!existingAutomation) {
            throw new NotFoundException('Automation not found');
        }

        // Validate email template exists if provided
        if (updateAutomationDto.emailTemplate?.id) {
            const emailTemplate = await this.emailTemplateService.getSingle(
                updateAutomationDto.emailTemplate.id,
            );
            if (!emailTemplate) {
                throw new NotFoundException('Email template not found');
            }
        }

        // Determine isActive based on status if status is being updated
        const isActive = updateAutomationDto.status
            ? updateAutomationDto.status === EAutomationStatus.ACTIVE
            : undefined;

        await this.update(id, {
            ...updateAutomationDto,
            ...(updateAutomationDto.emailTemplate?.id
                ? {
                    emailTemplate: {
                        id: updateAutomationDto.emailTemplate.id,
                    },
                }
                : {}),
            ...(isActive !== undefined ? { isActive } : {}),
        });

        return { message: 'Automation updated successfully.' };
    }

    async deleteAutomation(id: string): Promise<IMessageResponse> {
        const existingAutomation = await this.getSingle(id);
        if (!existingAutomation) {
            throw new NotFoundException('Automation not found');
        }

        await this.delete(id);
        return { message: 'Automation deleted successfully.' };
    }

    async updateAutomationStatus(
        id: string,
        status: EAutomationStatus,
    ): Promise<IMessageResponse & { automation: Automation }> {
        const existingAutomation = await this.getSingle(id);
        if (!existingAutomation) {
            throw new NotFoundException('Automation not found');
        }

        const isActive = status === EAutomationStatus.ACTIVE;
        
        this.logger.log(
            `Updating automation ${id}: status=${status}, isActive=${isActive} (previous: status=${existingAutomation.status}, isActive=${existingAutomation.isActive})`,
        );

        const updatedAutomation = await this.update(id, { status, isActive });

        this.logger.log(
            `Automation ${id} updated successfully: status=${updatedAutomation.status}, isActive=${updatedAutomation.isActive}`,
        );

        return {
            message: 'Automation status updated successfully.',
            automation: updatedAutomation,
        };
    }

    /**
     * Get all active automations for a specific trigger
     * Used by other services to execute automations when events occur
     */
    async getActiveAutomationsByTrigger(trigger: string): Promise<Automation[]> {
        // Use getRepository() from CrudService to ensure tenant-aware routing
        const repository = this.getRepository();
        
        const automations = await repository.find({
            where: {
                trigger: trigger as any,
                status: EAutomationStatus.ACTIVE,
                isActive: true,
            },
            relations: ['emailTemplate'],
        });

        this.logger.log(
            `Found ${automations.length} active automation(s) for trigger "${trigger}" (tenant: ${RequestContext.get<string>('tenantId') || 'none'})`,
        );

        return automations;
    }
}

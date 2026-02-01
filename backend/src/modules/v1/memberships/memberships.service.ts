import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Membership } from './entities/membership.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EBillingFrequency } from '@shared/enums/membership.enum';
import { DoorsService } from '../locations/doors/services/doors.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class MembershipsService extends CrudService<Membership> {
  private readonly customLogger = new LoggerService(MembershipsService.name);

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    private readonly doorsService: DoorsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['title', 'description'],
    };
    super(membershipRepo, moduleRef, crudOptions);
  }

  /**
   * Create membership with automatic price calculation
   * Uses CrudService create with beforeCreate callback to calculate price
   */
  async createMembership<TCreateDto>(createDto: TCreateDto): Promise<Membership> {
    const data = createDto as any;
    
    // Validate doors if provided
    if (data.doors && Array.isArray(data.doors) && data.doors.length > 0) {
      for (const doorDto of data.doors) {
        if (doorDto?.id) {
          const door = await this.doorsService.getSingle(doorDto.id);
          if (!door) {
            throw new NotFoundException(`Door with ID ${doorDto.id} not found`);
          }
        }
      }
    }

    return this.create(createDto, {
      beforeCreate: async (processedData: TCreateDto, manager: EntityManager) => {
        // Calculate price automatically
        const calculated = this.calculateMembershipPrice(processedData);
        const processed = processedData as any;
        // Use nested object format for arrays
        return {
          ...calculated,
          ...(processed.doors && Array.isArray(processed.doors) ? {
            doors: processed.doors.map((door: any) => ({ id: door.id })),
          } : {}),
        };
      },
    });
  }

  /**
   * Update membership with automatic price recalculation if needed
   * Uses CrudService update with beforeUpdate callback
   */
  async updateMembership<TUpdateDto>(
    id: string,
    updateDto: TUpdateDto,
  ): Promise<Membership> {
    const updateData = updateDto as any;
    
    // Validate doors if provided
    if (updateData.doors && Array.isArray(updateData.doors) && updateData.doors.length > 0) {
      for (const doorDto of updateData.doors) {
        if (doorDto?.id) {
          const door = await this.doorsService.getSingle(doorDto.id);
          if (!door) {
            throw new NotFoundException(`Door with ID ${doorDto.id} not found`);
          }
        }
      }
    }

    return this.update(id, updateDto, {
      beforeUpdate: async (
        processedData: TUpdateDto,
        existingEntity: Membership,
        manager: EntityManager,
      ) => {
        const processed = processedData as any;
        const transformedData = {
          ...processed,
          ...(processed.doors && Array.isArray(processed.doors) ? {
            doors: processed.doors.map((door: any) => ({ id: door.id })),
          } : {}),
        };
        
        // Check if price, pricePeriod, or billingFrequency is being updated
        const needsRecalculation =
          processed.price !== undefined ||
          processed.pricePeriod !== undefined ||
          processed.billingFrequency !== undefined;

        if (needsRecalculation) {
          // Merge existing data with update data to calculate new price
          const mergedData = {
            ...existingEntity,
            ...processed,
            price: processed.price ?? existingEntity.price,
            pricePeriod: processed.pricePeriod ?? existingEntity.pricePeriod,
            billingFrequency: processed.billingFrequency ?? existingEntity.billingFrequency,
          };
          
          const calculatedData = this.calculateMembershipPrice(mergedData);
          transformedData.calculatedPrice = calculatedData.calculatedPrice;
        }

        return transformedData;
      },
    });
  }

  /**
   * Calculate membership price based on price, pricePeriod, and billingFrequency
   */
  private calculateMembershipPrice(data: any): any {
    const price = Number(data.price) || 0;
    const pricePeriod = Number(data.pricePeriod) || 1;
    const billingFrequency = data.billingFrequency as EBillingFrequency;

    if (!price || !pricePeriod || !billingFrequency) {
      // If required fields are missing, set calculatedPrice to null
      return {
        ...data,
        calculatedPrice: null,
      };
    }

    // Calculate base price per period (monthly rate)
    const basePricePerPeriod = price / pricePeriod;

    // Adjust based on billing frequency
    let calculatedPrice: number;
    switch (billingFrequency) {
      case EBillingFrequency.WEEKLY:
        // Weekly: divide by 4 (4 weeks in a month)
        calculatedPrice = basePricePerPeriod / 4;
        break;
      case EBillingFrequency.MONTHLY:
        // Monthly: divide by 1 (no change)
        calculatedPrice = basePricePerPeriod / 1;
        break;
      case EBillingFrequency.QUARTERLY:
        // Quarterly: multiply by 3 (3 months)
        calculatedPrice = basePricePerPeriod * 3;
        break;
      case EBillingFrequency.ANNUALLY:
        // Yearly: multiply by 12 (12 months)
        calculatedPrice = basePricePerPeriod * 12;
        break;
      case EBillingFrequency.BI_ANNUALLY:
        // Bi-annually: multiply by 6 (6 months)
        calculatedPrice = basePricePerPeriod * 6;
        break;
      case EBillingFrequency.DAILY:
        // Daily: divide by 30 (approximate days in a month)
        calculatedPrice = basePricePerPeriod / 30;
        break;
      default:
        calculatedPrice = basePricePerPeriod;
    }

    // Round to 2 decimal places
    calculatedPrice = Math.round(calculatedPrice * 100) / 100;

    return {
      ...data,
      calculatedPrice,
    };
  }
}


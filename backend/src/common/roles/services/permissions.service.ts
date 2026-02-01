import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { CrudService } from '@/common/crud/crud.service';
import { IPaginatedResponse } from '@shared/interfaces';

@Injectable()
export class PermissionsService extends CrudService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    moduleRef: ModuleRef,
  ) {
    super(permissionRepository, moduleRef, {
      searchableFields: ['name', 'displayName'],
    });
  }


}

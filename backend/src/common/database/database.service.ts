import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { DatabaseConnectionEntity } from './entities/database-connection.entity';
import { DatabaseConnectionListDto } from '@shared/dtos';
import { IPaginatedResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class DatabaseService extends CrudService<DatabaseConnectionEntity> {
  constructor(
    @InjectRepository(DatabaseConnectionEntity)
    private readonly connectionRepository: Repository<DatabaseConnectionEntity>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['connectionName', 'host', 'database'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
    };
    super(connectionRepository, moduleRef, crudOptions);
  }

  async getConnections(
    query: DatabaseConnectionListDto,
  ): Promise<IPaginatedResponse<DatabaseConnectionEntity>> {
    return this.get(query, DatabaseConnectionListDto);
  }
}

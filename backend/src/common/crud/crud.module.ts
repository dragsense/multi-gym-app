import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from '../helper/services/event.service';

@Module({
  imports: [TypeOrmModule],
  providers: [EventService],
  exports: [EventService],
})
export class CrudModule {}

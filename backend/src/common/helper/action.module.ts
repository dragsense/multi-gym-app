import { Module, Global } from '@nestjs/common';
import { ActionRegistryService } from './services/action-registry.service';
import { EventService } from './services/event.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Global()
@Module({
  imports: [ActivityLogsModule],
  providers: [ActionRegistryService, EventService],
  exports: [ActionRegistryService, EventService],
})
export class ActionModule { }

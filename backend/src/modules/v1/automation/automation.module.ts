import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { Automation } from './entities/automation.entity';
import { CmsModule } from '../cms/cms.module';
import { AutomationEventListenerService } from './services/automation-event-listener.service';
import { AutomationExecutionService } from './services/automation-execution.service';
import { CheckinsModule } from '../checkins/checkins.module';
import { BillingsModule } from '../billings/billings.module';
import { MembersModule } from '../members/members.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Automation]),
        forwardRef(() => CmsModule),
        forwardRef(() => CheckinsModule),
        forwardRef(() => BillingsModule),
        forwardRef(() => MembersModule),
        forwardRef(() => MembershipsModule),
    ],
    controllers: [AutomationController],
    providers: [
        AutomationService,
        AutomationEventListenerService,
        AutomationExecutionService,
    ],
    exports: [AutomationService],
})
export class AutomationModule { }

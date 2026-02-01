import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { TaskIssueReport } from './entities/task-issue-report.entity';
import { TaskTimeLog } from './entities/task-time-log.entity';
import { TaskActivityLog } from './entities/task-activity-log.entity';
import { OverrideRecurrenceTask } from './entities/override-recurrence-task.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { ScheduleModule } from '@/common/schedule/schedule.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { LocationsModule } from '../locations/locations.module';
import { DoorsModule } from '../locations/doors/doors.module';
import { TaskNotificationService } from './services/task-notification.service';
import { TaskCommentsService } from './services/task-comments.service';
import { TaskIssueReportsService } from './services/task-issue-reports.service';
import { TaskTimeLogsService } from './services/task-time-logs.service';
import { TaskEventListenerService } from './services/task-event-listener.service';
import { TaskActivityLogService } from './services/task-activity-log.service';
import { TaskEmailService } from './services/task-email.service';
import { TaskProcessor } from './services/task.processor';
import { TaskCommentsController } from './controllers/task-comments.controller';
import { TaskIssueReportsController } from './controllers/task-issue-reports.controller';
import { TaskTimeLogsController } from './controllers/task-time-logs.controller';
import { TaskActivityLogsController } from './controllers/task-activity-logs.controller';
import { TaskSubscriber } from './subscribers/task.subscriber';
import { EmailTemplateService } from '@/common/email/email-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskComment, TaskIssueReport, TaskTimeLog, TaskActivityLog, OverrideRecurrenceTask]),
    CrudModule,
    ScheduleModule,
    BullModule.registerQueue({ name: 'task' }),
    UsersModule,
    NotificationModule,
    LocationsModule,
    DoorsModule,
  ],
  exports: [TasksService, TaskCommentsService, TaskIssueReportsService, TaskTimeLogsService, TaskActivityLogService],
  controllers: [
    TasksController,
    TaskCommentsController,
    TaskIssueReportsController,
    TaskTimeLogsController,
    TaskActivityLogsController,
  ],
  providers: [
    TasksService,
    TaskNotificationService,
    TaskEventListenerService,
    TaskCommentsService,
    TaskIssueReportsService,
    TaskTimeLogsService,
    TaskActivityLogService,
    TaskEmailService,
    TaskProcessor,
    TaskSubscriber,
    EmailTemplateService,
  ],
})
export class TasksModule {}


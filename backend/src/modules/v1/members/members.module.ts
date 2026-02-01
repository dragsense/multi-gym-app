import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { Member } from './entities/member.entity';
import { MemberNote } from './entities/member-note.entity';
import { LinkMember } from './entities/link-member.entity';
import { MemberNoteService } from './services/member-note.service';
import { LinkMemberService } from './services/link-member.service';
import { MemberNoteController } from './controllers/member-note.controller';
import { LinkMemberController } from './controllers/link-member.controller';
import { CrudModule } from '@/common/crud/crud.module';
import { UsersModule } from '../users/users.module';
import { Billing } from '../billings/entities/billing.entity';
import { Session } from '../sessions/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member, MemberNote, LinkMember, Billing, Session]),
    CrudModule,
    UsersModule,
  ],
  exports: [MembersService, MemberNoteService, LinkMemberService],
  controllers: [MembersController, MemberNoteController, LinkMemberController],
  providers: [MembersService, MemberNoteService, LinkMemberService],
})
export class MembersModule { }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { MemberNote } from '../entities/member-note.entity';

@Injectable()
export class MemberNoteService extends CrudService<MemberNote> {
  constructor(
    @InjectRepository(MemberNote)
    private readonly memberNoteRepo: Repository<MemberNote>,
    moduleRef: ModuleRef,
  ) {
    super(memberNoteRepo, moduleRef);
  }
}


# Repository Refactoring Guide

## Overview
This guide explains how to refactor services to use `EntityRouterService.getRepository()` instead of direct `@InjectRepository`.

## Key Points
1. **DataSource in CrudService**: Keep it - it's used for QueryRunner creation
2. **Services extending CrudService**: Still need `@InjectRepository` for `super()`, but use `this.getRepository()` for direct access
3. **Services NOT extending CrudService**: Remove `@InjectRepository`, inject `EntityRouterService`, use `entityRouterService.getRepository(EntityClass)`

## Patterns

### Pattern 1: Services Extending CrudService

**Before:**
```typescript
@Injectable()
export class MyService extends CrudService<MyEntity> {
  constructor(
    @InjectRepository(MyEntity)
    private readonly myRepo: Repository<MyEntity>,
    moduleRef: ModuleRef,
  ) {
    super(myRepo, moduleRef);
  }

  async someMethod() {
    const item = await this.myRepo.findOne({ where: { id: '123' } });
  }
}
```

**After:**
```typescript
@Injectable()
export class MyService extends CrudService<MyEntity> {
  constructor(
    @InjectRepository(MyEntity)
    private readonly myRepo: Repository<MyEntity>,
    moduleRef: ModuleRef,
  ) {
    super(myRepo, moduleRef);
  }

  async someMethod() {
    const repository = this.getRepository(); // Uses EntityRouterService internally
    const item = await repository.findOne({ where: { id: '123' } });
  }
}
```

### Pattern 2: Services NOT Extending CrudService

**Before:**
```typescript
@Injectable()
export class MyService {
  constructor(
    @InjectRepository(MyEntity)
    private readonly myRepo: Repository<MyEntity>,
    @InjectRepository(OtherEntity)
    private readonly otherRepo: Repository<OtherEntity>,
  ) {}

  async someMethod() {
    const item = await this.myRepo.findOne({ where: { id: '123' } });
    const other = await this.otherRepo.find();
  }
}
```

**After:**
```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly entityRouterService: EntityRouterService,
  ) {}

  async someMethod() {
    const myRepo = this.entityRouterService.getRepository<MyEntity>(MyEntity);
    const otherRepo = this.entityRouterService.getRepository<OtherEntity>(OtherEntity);
    const item = await myRepo.findOne({ where: { id: '123' } });
    const other = await otherRepo.find();
  }
}
```

### Pattern 3: Services with Multiple Repositories (Helper Methods)

**Before:**
```typescript
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}
}
```

**After:**
```typescript
@Injectable()
export class DashboardService {
  constructor(
    private readonly entityRouterService: EntityRouterService,
  ) {}

  private getUserRepository() {
    return this.entityRouterService.getRepository<User>(User);
  }

  private getSessionRepository() {
    return this.entityRouterService.getRepository<Session>(Session);
  }
}
```

## Files Updated
- ✅ `backend/src/common/settings/settings.service.ts`
- ✅ `backend/src/modules/v1/cms/services/page.service.ts`
- ✅ `backend/src/modules/v1/dashboard/dashboard.service.ts`
- ✅ `backend/src/common/roles/roles.service.ts`
- ✅ `backend/src/common/base-chat/base-chat.service.ts`

## Remaining Work
- 56 services extending CrudService need to replace direct repository usage with `this.getRepository()`
- ~52 services NOT extending CrudService need full refactoring

## Notes
- Services extending CrudService still need `@InjectRepository` to pass to `super()`
- Remove unused repository injections
- Remove `DataSource` injection if service extends CrudService (it's already available)
- Use helper methods for services with many repositories

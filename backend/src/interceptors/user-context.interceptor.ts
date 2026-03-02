import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RequestContext } from '../context/request-context';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
    level?: number;
    tenantId?: string;
  };
  tenantId?: string;
}

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userId = (request as RequestWithUser).user?.id;
    const userLevel = (request as RequestWithUser).user?.level;
    const tenantId = (request as RequestWithUser).user?.tenantId;

    if (userId) {
      RequestContext.set('userId', userId);
    }
    if (typeof userLevel === 'number') {
      RequestContext.set('userLevel', userLevel);
    }

    return next.handle();
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RequestContext } from './request-context';

interface RequestWithUser extends Request {
  user?: {
    id?: string;
  };
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const userId = (request as RequestWithUser).user?.id;

    if (userId) {
      RequestContext.set('userId', userId);
    }

    return next.handle();
  }
}

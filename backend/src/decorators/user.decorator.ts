import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { User } from '@/common/base-user/entities/user.entity';

export const AuthUser = createParamDecorator<User>(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user || !user.id) {
      throw new BadRequestException('Invalid user authentication');
    }

    return user;
  },
);

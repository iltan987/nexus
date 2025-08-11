import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type JwtPayload } from '@repo/shared/types/jwt-payload';

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);

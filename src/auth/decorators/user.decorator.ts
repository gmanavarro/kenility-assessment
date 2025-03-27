import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthenticationContext = createParamDecorator(
  (ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

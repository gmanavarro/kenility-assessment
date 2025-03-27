import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthenticationContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

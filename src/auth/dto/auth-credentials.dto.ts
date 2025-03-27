import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @ApiProperty({
    description: 'Username for authentication',
    example: 'testuser',
    minLength: 4,
    maxLength: 10,
    pattern: '^[a-zA-Z0-9]+$',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'username must contain only letters and numbers',
  })
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'Test1234',
    minLength: 8,
    maxLength: 16,
    pattern: '^[a-zA-Z0-9]+$',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(16)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'password must contain only letters and numbers',
  })
  password: string;
}

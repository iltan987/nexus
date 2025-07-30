import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  name?: string;

  @IsNotEmpty()
  username!: string;

  @Matches(/[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/, {
    message: 'Password must contain at least one symbol',
  })
  @Matches(/\d/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @Type(() => Date)
  @IsDate()
  dateOfBirth!: Date;
}

import {
  IsDateString,
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

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message:
      'dateOfBirth must be in YYYY-MM-DD format and must not contain a time part.',
  })
  @IsDateString({ strict: true })
  @IsNotEmpty()
  dateOfBirth!: Date;
}

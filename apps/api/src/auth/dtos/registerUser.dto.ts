import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';
import validator from 'validator';

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

  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      throw new BadRequestException(
        `Date of birth must be a string in YYYY-MM-DD format, received: ${typeof value}`,
      );
    }

    const isValidDate = validator.isDate(value, {
      format: 'YYYY-MM-DD',
      strictMode: true,
      delimiters: ['-'],
    });

    if (!isValidDate) {
      throw new BadRequestException(
        `Date of birth must be in YYYY-MM-DD format.`,
      );
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Date of birth must be a valid date.`);
    }

    return date;
  })
  @IsDate()
  @IsNotEmpty()
  dateOfBirth!: Date;
}

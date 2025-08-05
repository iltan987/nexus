import { BadRequestException, PipeTransform } from '@nestjs/common';
import { treeifyError, ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    const parsedResult = this.schema.safeParse(value);
    if (!parsedResult.success) {
      throw new BadRequestException(treeifyError(parsedResult.error));
    }
    return parsedResult.data;
  }
}

import { BadRequestException, PipeTransform } from '@nestjs/common';
import { treeifyError, ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  async transform(value: unknown) {
    const parsedResult = await this.schema.safeParseAsync(value);
    if (!parsedResult.success) {
      throw new BadRequestException(treeifyError(parsedResult.error));
    }
    return parsedResult.data;
  }
}

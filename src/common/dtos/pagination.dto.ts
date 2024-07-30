import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'Page number',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'The value must be an integer' })
  @Min(1, { message: 'The minimum value allowed is 1' })
  readonly page?: number = 1;

  @ApiProperty({
    description: 'Page size',
    default: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'The value must be an integer' })
  @Min(1, { message: 'The minimum value allowed is 1' })
  readonly pageSize?: number = 10;

  @ApiProperty({
    description: 'Search term',
    default: '',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value))
  readonly search?: string = '';
}

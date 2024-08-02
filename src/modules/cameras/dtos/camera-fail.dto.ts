import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CameraFailDto {
  @ApiProperty({
    description: 'The message describing the failure reason',
    example: 'Camera is not responding',
  })
  @IsString()
  message: string;
}

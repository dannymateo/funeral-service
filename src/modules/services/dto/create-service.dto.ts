import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'ID of the room where the event will take place',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'RoomId must be a valid UUID' })
  readonly roomId: string;

  @ApiProperty({
    description: 'Indicates if the service has streaming',
    example: true,
  })
  @IsBoolean({ message: 'HasStreaming must be a logical value' })
  readonly hasStreaming: boolean;

  @ApiProperty({
    description: 'Start date and time of the service',
    example: '2024-08-02T12:00:00Z',
  })
  @IsDateString({}, { message: 'StartAt must be a valid ISO date string' })
  readonly startAt: string;

  @ApiProperty({
    description: 'End date and time of the service',
    example: '2024-08-02T14:00:00Z',
  })
  @IsDateString({}, { message: 'EndAt must be a valid ISO date string' })
  readonly endAt: string;
}

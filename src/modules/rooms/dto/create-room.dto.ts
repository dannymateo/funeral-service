import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsBoolean, IsUUID } from 'class-validator';

export class CreateRoomDto {
	@ApiProperty({
		description: 'Name of the room',
		example: 'Room vigils 1',
	})
	@IsString({ message: 'Name is required' })
	@MinLength(3, { message: 'Name must be at least 3 characters long' })
	@MaxLength(50, { message: 'Name must be at most 50 characters long' })
	readonly name: string;

	@ApiProperty({
		description: 'Indicates if the room is active',
		example: true,
	})
	@IsBoolean({ message: 'Active must be a logical value' })
	readonly active: boolean;

	@ApiProperty({
		description: 'ID of the headquardter where the camera is located',
		example: 'uuid',
	  })
	  @IsUUID('4', { message: 'HeadquardterId must be a valid UUID' })
	  readonly headquarterId: string;
}
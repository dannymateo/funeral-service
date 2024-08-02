import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class CreateHeadquarterDto {
	@ApiProperty({
		description: 'Name of the headquarter',
		example: 'Bello',
	})
	@IsString({ message: 'Name is required' })
	@MinLength(3, { message: 'Name must be at least 3 characters long' })
	@MaxLength(50, { message: 'Name must be at most 50 characters long' })
	readonly name: string;

	@ApiProperty({
		description: 'Indicates if the headquarter is active',
		example: true,
	})
	@IsBoolean({ message: 'Active must be a logical value' })
	readonly active: boolean;
}
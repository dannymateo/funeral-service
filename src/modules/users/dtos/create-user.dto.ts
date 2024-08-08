import { ApiProperty } from '@nestjs/swagger';
import {
	IsString,
	MinLength,
	MaxLength,
	IsUUID,
	IsPhoneNumber,
	IsEmail,
	IsBoolean,
	IsUrl,
	IsOptional,
	IsDateString,
} from 'class-validator';

export class CreateUserDto {
	@ApiProperty({
		description: 'User role ID',
		example: 'f7b8a3b1-1c9a-4b0e-bc3b-7c3e1e0f7b8a',
	})
	@IsUUID('4', { message: 'Role ID must be a valid UUID' })
	readonly roleId: string;

	@ApiProperty({
		description: 'User name',
		example: 'luxuryvoyage Pérez',
	})
	@IsString({ message: 'Name is required' })
	@MinLength(5, { message: 'Name must be at least 5 characters' })
	@MaxLength(50, { message: 'Name must be at most 50 characters' })
	readonly name: string;

	@ApiProperty({
		description: 'User email',
		example: 'luxuryvoyage@luxuryvoyage.com',
	})
	@IsEmail({}, { message: 'Email must be a valid email' })
	readonly email: string;

	@ApiProperty({
		description: 'Indicates if the user is active',
		example: true,
	})
	@IsBoolean({ message: 'Active must be a boolean value' })
	readonly active: boolean = false;
}
import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

class TemplateAction {
	@IsString({ message: 'Action title must be a text.' })
	readonly title: string;

	@IsUrl({}, { message: 'Action URL must be valid.' })
	readonly url: string;

	@IsString({ message: 'Action description must be a text.' })
	readonly description: string;
}

export class GetEmailTemplateDto {
	@IsString({ message: 'Title must be a text.' })
	readonly title: string;

	@IsUrl({}, { message: 'Banner URL must be valid.' })
	@IsOptional()
	readonly banner?: string;

	@IsString({ message: 'Subtitle must be a text.' })
	readonly subtitle: string;

	@IsString({ message: 'Content must be a text.' })
	readonly content: string;

	@IsString({ message: 'Description must be a text.' })
	readonly description: string;

	@IsObject({ message: 'Action must be an object.' })
	@ValidateNested({ message: 'Action must be a valid object.' })
	@Type(() => TemplateAction)
	@IsOptional()
	readonly action?: TemplateAction;

	@IsString({ message: 'Footer must be a text.' })
	readonly footer: string;
}
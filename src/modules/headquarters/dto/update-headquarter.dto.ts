import { PartialType } from '@nestjs/swagger';

import { CreateHeadquarterDto } from './create-headquarter.dto';

export class UpdateHeadquarterRDto extends PartialType(CreateHeadquarterDto) {}
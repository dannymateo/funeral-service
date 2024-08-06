import { Module } from '@nestjs/common';

import { HeadquartersController } from './headquarters.controller';
import { headquartersService } from './headquarters.service';

@Module({
	controllers: [HeadquartersController],
	providers: [headquartersService],
})
export class HeadquartesModule {}
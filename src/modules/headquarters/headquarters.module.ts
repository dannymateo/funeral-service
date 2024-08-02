import { Module } from '@nestjs/common';

import { HeadquartersController } from './headquarters.controller';
import { headquartersService } from './headquarters.service';
import { FunctionsModule } from '../functions/functions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [FunctionsModule, PrismaModule],
	controllers: [HeadquartersController],
	providers: [headquartersService],
})
export class HeadquartesModule {}
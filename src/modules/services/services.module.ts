import { Module } from '@nestjs/common';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { FunctionsModule } from '../functions/functions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [FunctionsModule, PrismaModule],
	controllers: [ServicesController],
	providers: [ServicesService],
})
export class ServicesModule {}
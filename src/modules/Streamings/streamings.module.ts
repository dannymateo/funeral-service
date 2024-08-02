import { Module } from '@nestjs/common';

import { StreamingsController } from './streamings.controller';
import { StreamingsService } from './streamings.service';
import { FunctionsModule } from '../functions/functions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [FunctionsModule, PrismaModule],
	controllers: [StreamingsController],
	providers: [StreamingsService],
})
export class StreamingsModule {}
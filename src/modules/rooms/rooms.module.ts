import { Module } from '@nestjs/common';

import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { FunctionsModule } from '../functions/functions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [FunctionsModule, PrismaModule],
	controllers: [RoomsController],
	providers: [RoomsService],
})
export class RoomsModule {}
import { Module } from '@nestjs/common';

import { CamerasController } from './cameras.controller';
import { CamerasService } from './cameras.service';
import { MailModule } from '../mail/mail.module';
import { CamerasUtilsModule } from './utils/camerasUtils.mulude';
import { FunctionsModule } from '../functions/functions.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [FunctionsModule, PrismaModule, CamerasUtilsModule, MailModule],
	controllers: [CamerasController],
	providers: [CamerasService],
})
export class CamerasModule {}
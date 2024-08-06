import { Module } from '@nestjs/common';

import { CamerasController } from './cameras.controller';
import { CamerasService } from './cameras.service';
import { MailModule } from '../mail/mail.module';
import { CamerasOnlineModule } from '../camerasOnline/camerasOnline.mulude';

@Module({
	imports: [CamerasOnlineModule, MailModule],
	controllers: [CamerasController],
	providers: [CamerasService],
})
export class CamerasModule { }
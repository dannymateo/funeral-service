import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CamerasOnlineModule } from '../camerasOnline/camerasOnline.mulude';
import { MailModule } from '../mail/mail.module';
import { TimeModule } from '../Time/time.module';
import { BackgroundWorkerStreamingService } from './backgroundworkerStraming.service';

@Module({
  imports: [PrismaModule, CamerasOnlineModule, MailModule, TimeModule],
  providers: [BackgroundWorkerStreamingService],
  exports: [BackgroundWorkerStreamingService],
})
export class BackgroundWorkerServices { }

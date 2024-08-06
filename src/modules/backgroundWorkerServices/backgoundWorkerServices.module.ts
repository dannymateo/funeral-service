import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CamerasOnlineModule } from '../camerasOnline/camerasOnline.mulude';
import { MailModule } from '../mail/mail.module';
import { BackgroundWorkerStreamingService } from './backgroundworkerStraming.service';

@Module({
  imports: [PrismaModule, CamerasOnlineModule, MailModule],
  providers: [BackgroundWorkerStreamingService],
  exports: [BackgroundWorkerStreamingService],
})
export class BackgroundWorkerServices { }

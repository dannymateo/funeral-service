import { Module } from '@nestjs/common';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { TimeModule } from '../Time/time.module';

@Module({
	imports: [TimeModule],
	controllers: [ServicesController],
	providers: [ServicesService],
})
export class ServicesModule { }
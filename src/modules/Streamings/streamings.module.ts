import { Module } from '@nestjs/common';

import { StreamingsController } from './streamings.controller';
import { StreamingsService } from './streamings.service';

@Module({
	controllers: [StreamingsController],
	providers: [StreamingsService],
})
export class StreamingsModule { }
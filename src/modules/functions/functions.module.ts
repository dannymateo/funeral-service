import { Global, Module } from '@nestjs/common';

import { FunctionsService } from './functions.service';

@Global()
@Module({
	providers: [FunctionsService],
	exports: [FunctionsService],
})
export class FunctionsModule {}
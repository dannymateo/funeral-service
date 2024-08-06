import { Global, Module } from '@nestjs/common';

import { MailService } from './mail.service';
import { FunctionsModule } from '../functions/functions.module';

@Global()
@Module({
	imports: [FunctionsModule],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule { }
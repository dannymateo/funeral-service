import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		RoomsModule
	],
})
export class AppModule {
	static port: number;

	constructor(private readonly config: ConfigService) {
		AppModule.port = this.config.get('APP_PORT');
	}
}
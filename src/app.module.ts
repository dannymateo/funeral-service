import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { HeadquartesModule } from './modules/headquarters/headquarters.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CamerasModule } from './modules/cameras/cameras.module';
import { ServicesModule } from './modules/services/services.module';
import { StreamingsModule } from './modules/streamings/streamings.module';
import { BackgroundWorkerServices } from './modules/backgroundWorkerServices/backgoundWorkerServices.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        HeadquartesModule,
        RoomsModule,
        CamerasModule,
        ServicesModule,
        StreamingsModule,
        BackgroundWorkerServices,
    ],
})
export class AppModule {
    static port: number;

    constructor(
        private readonly config: ConfigService) {
        AppModule.port = this.config.get<number>('APP_PORT'); // Asegúrate de que el tipo sea correcto
    }
}
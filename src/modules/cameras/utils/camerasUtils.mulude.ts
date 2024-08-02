import { Module } from '@nestjs/common';

import { CameraUtilsService } from './camerasUtils.service';
import { FunctionsModule } from '../../functions/functions.module';

@Module({
	imports: [FunctionsModule],
    providers: [CameraUtilsService], 
    exports: [CameraUtilsService]
})
export class CamerasUtilsModule {}
import { Module } from '@nestjs/common';

import { CameraOnlineService } from './camerasOnline.service';

@Module({
    providers: [CameraOnlineService],
    exports: [CameraOnlineService]
})
export class CamerasOnlineModule { }
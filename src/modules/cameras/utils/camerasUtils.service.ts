import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';

import { FunctionsService } from '../../functions/functions.service';
import { Messages } from 'src/common/enums';

const BASE_PATH_SH = '/var/www/cameras/cams_sh';
const BASE_PATH_LIVE = '/var/www/cameras/live';
const BASE_PATH_SERVICE = '/etc/systemd/system';

@Injectable()
export class CameraUtilsService {
  constructor(private readonly functions: FunctionsService) {}

  async createCameraOnlineService(id: string, rtspUrl: string) {
    const scriptFilePath = path.join(BASE_PATH_SH, `camOnline-${id}.sh`);
    const cameraPathLive = path.join(BASE_PATH_LIVE, id);
    const serviceFilePath = path.join(BASE_PATH_SERVICE, `camOnline-${id}.service`);

    const scriptContent = `#!/bin/bash
      NOTIFY_URL="http://localhost:3000/notifyAlert/${id}"
      send_notification() {
        local message="$1"
        curl -X POST -H "Content-Type: application/json" -d "{\\"message\\": \\"$message\\"}" $NOTIFY_URL
      }
      while true; do
        ffmpeg -i ${rtspUrl} \\
          -s 854x480 \\
          -c:v libx264 \\
          -b:v 800k \\
          -tune zerolatency \\
          -preset ultrafast \\
          -hls_time 5 \\
          -hls_list_size 1 \\
          -hls_flags delete_segments \\
          ${path.join(cameraPathLive, 'stream.m3u8')}
        if [ $? -ne 0 ]; then
          send_notification "FFmpeg failed to start streaming from ${rtspUrl}."
          sleep 5
        else
          break
        fi
      done`;

    const serviceContent = `[Unit]
      Description=Servicio para iniciar el script cameraOnline-${id}.sh
      After=network.target
      [Service]
      Type=simple
      ExecStart=/bin/bash ${scriptFilePath}
      Restart=on-failure
      User=${process.env.USER}
      [Install]
      WantedBy=multi-user.target`;

    try {
      await this.functions.ensureDirectoryExists(BASE_PATH_SH);
      await this.functions.ensureDirectoryExists(BASE_PATH_LIVE);
      await this.functions.ensureDirectoryExists(BASE_PATH_SERVICE);

      if (await fs.stat(scriptFilePath).catch(() => false)) {
        throw new Error(`Script ${scriptFilePath} already exists`);
      }

      await fs.writeFile(scriptFilePath, scriptContent);
      await fs.chmod(scriptFilePath, '755');
      await fs.mkdir(cameraPathLive, { recursive: true });
      await fs.writeFile(serviceFilePath, serviceContent);

      await this.functions.execCommand(`systemctl stop camOnline-${id}.service`);
      await this.functions.execCommand('systemctl daemon-reload');

      this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.CREATED,
        message: Messages.SUCCESSFULLY_CREATED
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.functions.generateResponseApi({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error creating camera service: ${error.message}`,
      });
    }
  }

  async updateCameraOnlineScript(id: string, newRtspUrl: string) {
    const scriptFilePath = path.join(BASE_PATH_SH, `camOnline-${id}.sh`);
    try {
      let scriptContent = await fs.readFile(scriptFilePath, 'utf-8');
      const rtspUrlPattern = /ffmpeg -i (.*) \\/;
      scriptContent = scriptContent.replace(rtspUrlPattern, `ffmpeg -i ${newRtspUrl} \\`);

      await fs.writeFile(scriptFilePath, scriptContent);
      await this.functions.execCommand('systemctl daemon-reload');

      this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFULLY_UPDATED,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.functions.generateResponseApi({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error modifying camera script ${id}: ${error.message}`,
      });
    }
  }

  async removeCameraOnlineService(id: string) {
    const scriptFilePath = path.join(BASE_PATH_SH, `camOnline-${id}.sh`);
    const cameraPathLive = path.join(BASE_PATH_LIVE, id);
    const serviceFilePath = path.join(BASE_PATH_SERVICE, `camOnline-${id}.service`);

    try {
      await fs.unlink(scriptFilePath);
      await fs.rm(cameraPathLive, { recursive: true });
      await fs.unlink(serviceFilePath);

      await this.functions.execCommand(`systemctl stop camOnline-${id}.service`);
      await this.functions.execCommand('systemctl daemon-reload');

      this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFULLY_DELETED,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.functions.generateResponseApi({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error deleting camera service ${id}: ${error.message}`,
      });
    }
  }
}

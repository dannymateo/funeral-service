import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

import { FunctionsService } from '../functions/functions.service';
import { Messages } from 'src/common/enums';

const BASE_PATH_SH = '/var/www/cameras/cams_sh';
const BASE_PATH_LIVE = '/var/www/cameras/live';
const BASE_PATH_SERVICE = '/etc/systemd/system';

@Injectable()
export class CameraOnlineService {
  constructor(private readonly functions: FunctionsService) { }

  async createCameraOnlineService(id: string, rtspUrl: string) {
    const scriptFilePath = path.join(BASE_PATH_SH, `camOnline-${id}.sh`);
    const cameraPathLive = path.join(BASE_PATH_LIVE, id);
    const serviceFilePath = path.join(BASE_PATH_SERVICE, `camOnline-${id}.service`);

    const scriptContent = `#!/bin/bash
    NOTIFY_URL="http://localhost:3000/api/v1/cameras/cameraFail/${id}"
    
    send_notification() {
      local message="$1"
      curl -X PATCH -H "Content-Type: application/json" -d "{\"message\": \"$message\"}" "$NOTIFY_URL"
    }
    
    while true; do
      ffmpeg -i "${rtspUrl}" \\
        -s 854x480 \\
        -c:v libx264 \\
        -b:v 800k \\
        -tune zerolatency \\
        -preset ultrafast \\
        -hls_time 5 \\
        -hls_list_size 1 \\
        -hls_flags delete_segments \\
        "${path.join(cameraPathLive, 'stream.m3u8')}"
      
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

      await this.functions.execCommand('systemctl daemon-reload');

      return this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.CREATED,
        message: Messages.SUCCESSFULLY_CREATED
      }, 'Objet');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      else return this.functions.generateResponseApi({
        ok: false,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error creando el servicio de la cámara: ${error.message}`,
      }, 'HttpException');
    }
  }

  async updateCameraOnlineScript(id: string, newRtspUrl: string) {
    const scriptFilePath = path.join(BASE_PATH_SH, `camOnline-${id}.sh`);
    try {
      let scriptContent = await fs.readFile(scriptFilePath, 'utf-8');
      const rtspUrlPattern = /ffmpeg -i (.*) \\/;
      scriptContent = scriptContent.replace(rtspUrlPattern, `ffmpeg -i ${newRtspUrl} \\`);

      await fs.writeFile(scriptFilePath, scriptContent);

      // Check if the service is active
      const status: String = await this.functions.execCommand(`systemctl is-active camOnline-${id}.service`);

      if (status.includes('active')) {
        // Restart the service if it is active
        await this.functions.execCommand(`systemctl restart camOnline-${id}.service`);
      } else {
        // If the service is not active, just reload the daemon
        await this.functions.execCommand('systemctl daemon-reload');
      }

      return this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFULLY_UPDATED,
      }, 'Objet');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      else return this.functions.generateResponseApi({
        ok: false,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error modificando el servicio de la cámara: ${error.message}`,
      }, 'HttpException');
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

      return this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFULLY_DELETED,
      }, 'Objet');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      else return this.functions.generateResponseApi({
        ok: false,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error eliminado el servicio de la cámara: ${error.message}`,
      }, 'HttpException');
    }
  }

  async upCameraOnlineService(id: string): Promise<void> {
    const cameraPathLive = path.join(BASE_PATH_LIVE, id);

    try {
      // Limpia el contenido del directorio
      await this.clearDirectoryContents(cameraPathLive);

      // Intenta iniciar el servicio asociado a la cámara
      await this.functions.execCommand(`systemctl start camOnline-${id}.service`);

      // Genera una respuesta exitosa
      this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFUL,
      }, 'Objet');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.functions.generateResponseApi({
          ok: false,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error iniciando el servicio de la cámara: ${error.message}`,
        }, 'HttpException');
      }
    }
  }

  async downCameraOnlineService(id: string): Promise<void> {
    const cameraPathLive = path.join(BASE_PATH_LIVE, id);
    try {
      // Limpia el contenido del directorio
      await this.clearDirectoryContents(cameraPathLive);

      // Detiene el servicio
      await this.functions.execCommand(`systemctl stop camOnline-${id}.service`);

      this.functions.generateResponseApi({
        ok: true,
        status: HttpStatus.OK,
        message: Messages.SUCCESSFUL
      }, 'Objet');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        this.functions.generateResponseApi({
          ok: false,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error deteniendo el servicio de la cámara: ${error.message}`,
        }, 'HttpException');
      }
    }
  }

  private async clearDirectoryContents(directoryPath: string): Promise<void> {
    try {
      // Obtiene la lista de archivos y directorios en el directorio especificado
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });

      // Elimina el contenido del directorio
      await Promise.all(entries.map(entry => {
        const fullPath = path.join(directoryPath, entry.name);
        return entry.isDirectory() ? fs.rmdir(fullPath, { recursive: true }) : fs.unlink(fullPath);
      }));
    } catch (error) {
      throw error;
    }
  }
}
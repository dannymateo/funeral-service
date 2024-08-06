import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { CameraOnlineService } from '../camerasOnline/camerasOnline.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BackgroundWorkerStreamingService {
  private readonly logger = new Logger(BackgroundWorkerStreamingService.name);
  private readonly colombiaTimeZone = 'America/Bogota';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cameraOnlineService: CameraOnlineService,
    private readonly mail: MailService
  ) { }

  @Interval(1000) // Ajustar intervalo según sea necesario
  async handleCron() {
    try {
      // await this.handleUpCameraOnline();
      // await this.handleDownCameraOnline();
    } catch (error) {
      this.logger.error('Error en el cron:', error);

      // Enviar email si falla
      const emailOptions = {
        to: process.env.SUPPORT_EMAIL,
        subject: 'Notificación de Fallo del segundo plano de activar o bajar servicios online',
        html: this.mail.getEmailTemplate({
          title: 'Fallo en la Cámara',
          banner: 'Ha ocurrido un error',
          subtitle: 'El servicio en segundo plano de los online ha fallado',
          content: null,
          description: `Mensaje: ${error.message}`,
          action: null,
          footer: 'Por favor, revisa el sistema.',
        }),
      };

      // await this.mail.sendMail(emailOptions);
    }
  }

  // private async handleUpCameraOnline() {
  //   const now = new Date();
  //   const zonedNow = toZonedTime(now, this.colombiaTimeZone);
  //   const isoNow = format(zonedNow, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: this.colombiaTimeZone });

  //   // Buscar servicios que deberían estar activos
  //   const servicesWithActiveStreaming = await this.prisma.service.findMany({
  //     where: {
  //       AND: [
  //         { startAt: { gte: isoNow } },
  //         { endAt: { lte: isoNow } },
  //         { current: false }
  //       ]
  //     },
  //     include: {
  //       room: {
  //         include: {
  //           cameras: {
  //             include: {
  //               cameraOnline: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  //   console.log(isoNow)
  //   this.logger.debug(`Found ${servicesWithActiveStreaming.length} services to update as ONLINE`);

  //   // Procesar en una transacción
  //   await this.prisma.$transaction(async (prisma) => {
  //     await Promise.all(
  //       servicesWithActiveStreaming.map(async (service) => {
  //         await prisma.service.update({
  //           where: { id: service.id },
  //           data: { current: true },
  //         });

  //         await Promise.all(
  //           service.room.cameras.map(async (camera) => {
  //             await prisma.cameraOnline.updateMany({
  //               where: { cameraId: camera.id },
  //               data: {
  //                 status: 'ONLINE',
  //                 current: true,
  //               },
  //             });
  //           })
  //         );
  //       })
  //     );
  //   });
  // }

  // private async handleDownCameraOnline() {
  //   const now = new Date();
  //   const zonedNow = toZonedTime(now, this.colombiaTimeZone);
  //   const isoNow = format(zonedNow, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: this.colombiaTimeZone });

  //   // Buscar servicios que deberían estar inactivos
  //   const servicesWithEndedStreaming = await this.prisma.service.findMany({
  //     where: {
  //       endAt: {
  //         lte: isoNow,
  //       },
  //       current: true,
  //     },
  //     include: {
  //       room: {
  //         include: {
  //           cameras: true
  //         },
  //       },
  //     },
  //   });
    
  //   console.log()
  //   this.logger.debug(`Found ${servicesWithEndedStreaming.length} services to update as OFFLINE`);

  //   // Procesar en una transacción
  //   await this.prisma.$transaction(async (prisma) => {
  //     await Promise.all(
  //       servicesWithEndedStreaming.map(async (service) => {
  //         await prisma.service.update({
  //           where: { id: service.id },
  //           data: { current: false },
  //         });

  //         this.logger.debug(`Service with ID ${service.id} marked as inactive.`);

  //         await Promise.all(
  //           service.room.cameras.map(async (camera) => {
  //             await prisma.cameraOnline.updateMany({
  //               where: { cameraId: camera.id },
  //               data: {
  //                 status: 'OFFLINE',
  //                 current: false,
  //               },
  //             });

  //             this.logger.debug(`Camera with ID ${camera.id} marked as OFFLINE.`);
  //           })
  //         );
  //       })
  //     );
  //   });
  // }
}
// await this.cameraOnlineService.upCameraOnlineService(camera.id);
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { CameraOnlineService } from '../camerasOnline/camerasOnline.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BackgroundWorkerStreamingService {
  private readonly logger = new Logger(BackgroundWorkerStreamingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cameraOnlineService: CameraOnlineService,
		private readonly mail: MailService
  ) { }

  // @Cron(CronExpression.EVERY_5_SECONDS)  
  @Interval(5000)
  async handleCron() {
    try {
      await this.handleUpCameraOnline();
      await this.handleDownCameraOnline();
    } catch (error) {
      //enviar email si falla
			const emailOptions = {
				to: process.env.SUPPORT_EMAIL,
				subject: 'Notificación de Fallo del segundo plano de activar o bajar servicios online',
				html: this.mail.getEmailTemplate({
					title: 'Fallo en la Cámara',
					banner: null,
					subtitle: 'El servicio en segundo plano de los online ha fallado',
					content: null,
					description: `Mensaje: ${error}`,
					action: null,
					footer: 'Por favor, revisa el sistema.',
				}),
			};

			await this.mail.sendMail(emailOptions);
    }
  }

  private async handleUpCameraOnline() {
    const now = new Date();

    const servicesWithActiveStreaming = await this.prisma.service.findMany({
      where: {
        startAt: {
          lte: now,
        },
        endAt: {
          gte: now,
        },
        hasStreaming: true,
        current: false,
      },
      include: {
        room: {
          include: {
            cameras: {
              include: {
                cameraOnline: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.$transaction(async (prisma) => {
      await Promise.all(
        servicesWithActiveStreaming.map(async (service) => {
          await prisma.service.update({
            where: { id: service.id },
            data: { current: true },
          });

          await Promise.all(
            service.room.cameras.map(async (camera) => {
              await prisma.cameraOnline.updateMany({
                where: { cameraId: camera.id },
                data: {
                  status: 'ONLINE',
                  current: true,
                },
              });

              // await this.cameraOnlineService.upCameraOnlineService(camera.id);
            })
          );

        })
      );
    });
  }

  private async handleDownCameraOnline() {
    const now = new Date();

    const servicesWithActiveStreaming = await this.prisma.service.findMany({
      where: {
        endAt: {
          lte: now,
        },
        hasStreaming: true,
        current: true,
      },
      include: {
        room: {
          include: {
            cameras: {
              include: {
                cameraOnline: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.$transaction(async (prisma) => {
      await Promise.all(
        servicesWithActiveStreaming.map(async (service) => {
          await prisma.service.update({
            where: { id: service.id },
            data: { current: false },
          });

          await Promise.all(
            service.room.cameras.map(async (camera) => {
              await prisma.cameraOnline.updateMany({
                where: { cameraId: camera.id },
                data: {
                  status: 'OFFLINE',
                  current: false,
                },
              });

              // await this.cameraOnlineService.upCameraOnlineService(camera.id);
            })
          );
        })
      );
    });
  }
}

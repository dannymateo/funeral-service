import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { CameraOnlineService } from '../camerasOnline/camerasOnline.service';
import { MailService } from '../mail/mail.service';
import { TimeService } from '../Time/time.service';

@Injectable()
export class BackgroundWorkerStreamingService {
  private readonly logger = new Logger(BackgroundWorkerStreamingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cameraOnlineService: CameraOnlineService,
    private readonly mail: MailService,
		private readonly timeService: TimeService,
  ) { }

  @Interval(1000)
  async handleCron() {
    try {
      await this.handleUpCameraOnline();
      await this.handleDownCameraOnline();
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

      await this.mail.sendMail(emailOptions);
    }
  }

  private async handleUpCameraOnline() {
		const now = this.timeService.convertUtcToColombia(new Date().toISOString());
  
    // Buscar servicios que deberían estar activos
    const servicesWithActiveStreaming = await this.prisma.service.findMany({
      where: {
        startAt: { lte: now }, // El tiempo de inicio debe ser menor o igual a la hora actual
        endAt: { gte: now },   // El tiempo de fin debe ser mayor o igual a la hora actual
        current: false,        // Solo servicios que actualmente no están activos
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
  
    this.logger.debug(`Found ${servicesWithActiveStreaming.length} services to update as ONLINE`);
  
    // Actualizar servicios y cámaras en una transacción
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

              await this.cameraOnlineService.upCameraOnlineService(camera.id);
            })
          );
        })
      );
    });
  }
  

  private async handleDownCameraOnline() {
		const now = this.timeService.convertUtcToColombia(new Date().toISOString());
  
    // Buscar servicios que deberían estar inactivos
    const servicesWithEndedStreaming = await this.prisma.service.findMany({
      where: {
        endAt: { lt: now },   // El tiempo de fin debe ser menor que la hora actual
        current: true,        // Solo servicios que actualmente están activos
      },
      include: {
        room: {
          include: {
            cameras: true
          },
        },
      },
    });
  
    this.logger.debug(`Found ${servicesWithEndedStreaming.length} services to update as OFFLINE`);
  
    // Actualizar servicios y cámaras en una transacción
    await this.prisma.$transaction(async (prisma) => {
      await Promise.all(
        servicesWithEndedStreaming.map(async (service) => {
          await prisma.service.update({
            where: { id: service.id },
            data: { current: false },
          });
  
          this.logger.debug(`Service with ID ${service.id} marked as inactive.`);
  
          await Promise.all(
            service.room.cameras.map(async (camera) => {
              await prisma.cameraOnline.updateMany({
                where: { cameraId: camera.id },
                data: {
                  status: 'OFFLINE',
                  current: false,
                },
              });
  
              await this.cameraOnlineService.downCameraOnlineService(camera.id);
            })
          );
        })
      );
    });
  }
  
}
//Segundo plano para ejecutar o parar los CamOnline y los services
//Un signIn para el streaming poniendo la contraseña del cameraOnline y entregue un token con el id del Servicio y esto siempre se valide en los end point con seguridad
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';

import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class StreamingsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly functions: FunctionsService,
    ) { }

    async getPTZs(id: string) {
        try {

            const service = await this.prisma.service.findUnique({
                where: { id },
                include: {
                    room: {
                        include: {
                            cameras: {
                                include: {
                                    movementsPTZ: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!service) {
                this.functions.generateResponseApi({
                    status: HttpStatus.NOT_FOUND,
                    message: `${Messages.ERROR_FETCHING} "Servicio no encontrado."`,
                });
            }

            const PTZs = service.room.cameras.flatMap((camera) =>
                camera.movementsPTZ
                    .map(({ id, name, order }) => ({ id, name, order }))
            )
                .sort((a, b) => a.order - b.order)
                .map(({ id, name }) => ({ id, name }));

            this.functions.generateResponseApi({
                ok: true,
                status: HttpStatus.OK,
                data: [PTZs]
            });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            else this.functions.generateResponseApi({});
        }
    }

    async execPTZ(id: string) {
        try {
            // Buscar el movimiento PTZ y las relaciones asociadas
            const actualPTZ = await this.prisma.movementsPTZ.findUnique({
                where: { id },
                include: {
                    camera: {
                        include: {
                            authCamera: true,
                        },
                    },
                },
            });

            // Verificar si el movimiento PTZ existe
            if (!actualPTZ) {
                this.functions.generateResponseApi({
                    status: HttpStatus.NOT_FOUND,
                    message: Messages.NO_DATA_FOUND,
                });
            }

            // Realizar la solicitud al endpoint para ejecutar el movimiento PTZ
            try {
                const { userName, password, ipAddress, httpPort } = actualPTZ.camera.authCamera;
                const endpointUrl = `http://${userName}:${password}@${ipAddress}:${httpPort}${actualPTZ.endPoint}`;

                await axios.put(endpointUrl, {}, { timeout: 3000 });

                // Respuesta de éxito
                this.functions.generateResponseApi({
                    ok: true,
                    status: HttpStatus.OK,
                    message: Messages.SUCCESSFUL,
                });
            } catch (error) {
                // Manejo de errores específicos
                if (error.code === 'ETIMEDOUT') {
                    this.functions.generateResponseApi({
                        status: HttpStatus.REQUEST_TIMEOUT,
                        message: 'Se agotó el tiempo de espera de la solicitud al ejecutar el movimiento PTZ.',
                    });
                } else {
                    this.functions.generateResponseApi({
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Se produjo un error al ejecutar el movimiento PTZ.',
                    });
                }
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;
            else this.functions.generateResponseApi({});
        }
    }
}
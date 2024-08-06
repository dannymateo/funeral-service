//Segundo plano para ejecutar o parar los CamOnline y los services ejecutarlos con el systemctl o pararlos y ademas actualizar la data en base de datos
//Un signIn para el streaming poniendo la contraseña del cameraOnline y entregue un token con el id del Servicio y esto siempre se valide en los end point con seguridad
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';
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
                where: { id, current: true },
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
                return this.functions.generateResponseApi({
                    status: HttpStatus.NOT_FOUND,
                    message: `${Messages.NO_DATA_FOUND} "Servicio no encontrado o no activo."`,
                }, 'HttpException');
            }

            const PTZs = service.room.cameras.flatMap((camera) =>
                camera.movementsPTZ
                    .map(({ id, name, order }) => ({ id, name, order }))
            )
                .sort((a, b) => a.order - b.order)
                .map(({ id, name }) => ({ id, name }));

            return this.functions.generateResponseApi({
                ok: true,
                status: HttpStatus.OK,
                data: [PTZs]
            }, 'Objet');
        } catch (error) {
            if (error instanceof HttpException) throw error;
            else {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Se produjo un error al obtener los movimientos PTZ.',
                }, 'HttpException');
            }
        }
    }

    async execPTZ(id: string) {
        try {
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

            if (!actualPTZ) {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.NOT_FOUND,
                    message: Messages.NO_DATA_FOUND,
                }, 'HttpException');
            }

            const { userName, password, ipAddress, httpPort } = actualPTZ.camera.authCamera;
            const endpointUrl = `http://${ipAddress}:${httpPort}${actualPTZ.endPoint}`;
            const auth = {
                username: userName,
                password: password,
                sendImmediately: false,
            };

            const response = await axios.put(endpointUrl, {}, {
                auth,
                timeout: 3000,
                responseType: 'text',
            });

            const result = await parseStringPromise(response.data);
            const statusCode = result.ResponseStatus.statusCode[0];
            const statusString = result.ResponseStatus.statusString[0];

            if (statusCode === '1' && statusString === 'OK') {
                return this.functions.generateResponseApi({
                    ok: true,
                    status: HttpStatus.OK,
                    message: Messages.SUCCESSFUL,
                }, 'Objet');
            } else {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.BAD_REQUEST,
                    message: `Error de la cámara: ${statusString}`,
                }, 'HttpException');
            }
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.REQUEST_TIMEOUT,
                    message: 'Se agotó el tiempo de espera de la solicitud al ejecutar el movimiento PTZ.',
                }, 'HttpException');
            } else if (error.response && error.response.status === HttpStatus.UNAUTHORIZED) {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.UNAUTHORIZED,
                    message: 'Autenticación fallida al intentar ejecutar el movimiento PTZ.',
                }, 'HttpException');
            } else {
                return this.functions.generateResponseApi({
                    ok: false,
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Se produjo un error al ejecutar el movimiento PTZ.',
                }, 'HttpException');
            }
        }
    }
}
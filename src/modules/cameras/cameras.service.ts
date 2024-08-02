import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import { CreateCameraDto } from './dtos/create-camera.dto';
import { UpdateCameraDto } from './dtos/update-camera.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { CameraUtilsService } from './utils/camerasUtils.service';
import { MailService } from '../mail/mail.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class CamerasService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly functions: FunctionsService,
		private readonly camerasUtils: CameraUtilsService,
		private readonly mail: MailService,
	) { }

	async create(createCameraDto: CreateCameraDto) {
		const idCamera = uuidv4();
		const { name, active, hasPTZ, roomId, authCamera, movementsPTZ } = createCameraDto;

		try {
			const result = await this.prisma.$transaction(async (prisma) => {

				// Verificar si la habitación existe y está activa
				const existRoom = await prisma.room.findUnique({
					where: { id: roomId, active: true },
				});

				if (!existRoom || !existRoom.active) {
					this.functions.generateResponseApi({
						status: HttpStatus.NOT_FOUND,
						message: `${Messages.ERROR_CREATING} "La sala que se está asociando no existe o está inactiva."`,
					});
				}

				// Verificar si ya existe una cámara en esta sala
				const existCamera = await prisma.camera.findFirst({
					where: { name, roomId },
				});

				if (existCamera) {
					this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_UPDATING} "Ya existe una cámara con este nombre para esta sala."`,
					});
				}

				// Verificar si ya existe una cámara con el mismo nombre
				const duplicateCamera = await prisma.camera.findFirst({
					where: { name },
				});

				if (duplicateCamera) {
					this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_CREATING} "Ya existe una cámara con este nombre."`,
					});
				}

				// Crear la autenticación de la cámara
				const authCameraCreate = await prisma.authCamera.create({
					data: {
						...authCamera,
						rtspPort: authCamera.rtspPort.toString(),
						httpPort: authCamera.httpPort.toString(),
					},
				});

				// Crear la cámara con la relación de autenticación
				const cameraData = await prisma.camera.create({
					data: {
						id: idCamera,
						name,
						active,
						hasPTZ,
						roomId,
						authCameraId: authCameraCreate.id,
					},
				});

				// Crear servicios de streaming para la cámara
				// await this.camerasUtils.createCameraOnlineService(
				//   cameraData.id,
				//   `rtsp://${authCameraCreate.userName}:${authCameraCreate.password}@${authCameraCreate.ipAddress}:${authCameraCreate.rtspPort}${authCameraCreate.endPointRtsp}`
				// );

				return cameraData;
			});

			// Validar los movimientos PTZ
			if (hasPTZ && movementsPTZ?.length > 0) {
				// Validar nombres duplicados
				const names = movementsPTZ.map(movement => movement.name);
				const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

				if (duplicateNames.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `${Messages.ERROR_UPDATING} "Hay nombres de movimientos PTZ duplicados: ${duplicateNames.join(', ')}."`,
					});
				}

				// Validar órdenes duplicados
				const orders = movementsPTZ.map(movement => movement.order);
				const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);

				if (duplicateOrders.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `${Messages.ERROR_UPDATING} "Hay órdenes de movimientos PTZ duplicadas: ${duplicateOrders.join(', ')}."`,
					});
				}

				// Insertar los movimientos PTZ nuevos
				await Promise.all(
					movementsPTZ.map((movement) =>
						this.prisma.movementsPTZ.create({
							data: {
								name: movement.name,
								order: movement.order,
								endPoint: movement.endPoint,
								cameraId: idCamera,
							},
						})
					)
				);
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [result],
			});

		} catch (error) {

			//Eliminar los archivos para el online de la camara
			//   await this.camerasUtils.removeCameraOnlineService(idCamera);

			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async findAll(query: PaginationDto) {
		try {
			const { search, page, pageSize } = query;

			const searchCondition = search && search.trim() !== ''
				? { name: { contains: search.toLowerCase() } }
				: {}; // No aplicar filtro si `search` es vacío o nulo

			const [cameras, total] = await this.prisma.$transaction([
				this.prisma.camera.findMany({
					where: searchCondition,
					include: {
						room: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						name: 'asc',
					},
					skip: page > 0 ? (page - 1) * pageSize : 0,
					take: pageSize,
				}),
				this.prisma.camera.count({
					where: searchCondition,
				}),
			]);

			const totalPages = Math.ceil(total / query.pageSize);

			if (!cameras || !cameras.length || total === 0 || totalPages === 0) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: cameras,
				meta: {
					page,
					pageSize,
					totalPages,
					total,
					search,
				},
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async findOne(id: string) {
		try {
			const camera = await this.prisma.camera.findUnique({
				where: {
					id,
				},
				include: { authCamera: true }
			});


			if (!camera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			// Obtener movimientos PTZ si la cámara tiene esta funcionalidad
			const listPTZ = camera.hasPTZ
				? await this.prisma.movementsPTZ.findMany({
					where: { cameraId: camera.id },
				})
				: [];

			// Construir la respuesta con la información obtenida
			const responseData = {
				...camera,
				listPTZ,
			};

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [responseData],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async getImagePreview(id: string) {
		try {
			// Buscar la cámara junto con la información de autenticación
			const camera = await this.prisma.camera.findUnique({
				where: { id },
				include: { authCamera: true },
			});

			// Verificar si la cámara existe
			if (!camera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			// Inicializar la variable para la imagen en base64
			let imagePreviewBase64 = null;

			try {
				// Hacer la solicitud al endpoint para obtener la imagen en base64
				const response = await axios.get(
					`http://${camera.authCamera.userName}:${camera.authCamera.password}@${camera.authCamera.ipAddress}:${camera.authCamera.httpPort}${camera.authCamera.endPointImagePreview}`,
					{
						responseType: 'arraybuffer',
						timeout: 3000, // Tiempo de espera de 3 segundos
					}
				);

				// Convertir la respuesta en Base64
				imagePreviewBase64 = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
			} catch (error) {
				// Manejo de errores específicos, como tiempos de espera
				if (error.code === 'ETIMEDOUT') {
					this.functions.generateResponseApi({
						status: HttpStatus.REQUEST_TIMEOUT,
						message: 'Se agotó el tiempo de espera de la solicitud al recuperar la vista previa de la imagen..',
					});
				} else {
					this.functions.generateResponseApi({
						status: HttpStatus.INTERNAL_SERVER_ERROR,
						message: 'Se produjo un error al recuperar la vista previa de la imagen.',
					});
				}
			}

			// Respuesta exitosa, aunque la imagen pueda ser null
			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [imagePreviewBase64],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async update(id: string, updateCameraDto: UpdateCameraDto) {
		const { name, active, hasPTZ, roomId, authCamera, movementsPTZ } = updateCameraDto;

		try {
			// Inicia una transacción para las operaciones que no sean los movimientos PTZ
			const result = await this.prisma.$transaction(async (prisma) => {
				// Verificar si la cámara existe
				const existingCamera = await prisma.camera.findUnique({
					where: { id },
					include: { authCamera: true }
				});

				if (!existingCamera) {
					this.functions.generateResponseApi({
						status: HttpStatus.NOT_FOUND,
						message: `${Messages.ERROR_UPDATING} "La cámara no existe."`,
					});
				}

				// Verificar si la habitación existe y está activa
				const existRoom = await prisma.room.findUnique({
					where: { id: roomId, active: true },
				});

				if (!existRoom || !existRoom.active) {
					this.functions.generateResponseApi({
						status: HttpStatus.NOT_FOUND,
						message: `${Messages.ERROR_CREATING} "La sala que se está asociando no existe o está inactiva."`,
					});
				}

				// Verificar si ya existe una cámara en esta sala
				const existCamera = await prisma.camera.findFirst({
					where: { roomId },
				});

				if (existCamera) {
					this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_CREATING} "Ya existe una cámara en esa sala."`,
					});
				}

				// Verificar si el nuevo nombre está en uso
				if (name && name !== existingCamera.name) {
					const existingNameCamera = await prisma.camera.findUnique({
						where: { name, roomId },
					});

					if (existingNameCamera) {
						this.functions.generateResponseApi({
							status: HttpStatus.CONFLICT,
							message: `${Messages.ERROR_UPDATING} "Ya existe una cámara con este nombre para esta sala."`,
						});
					}
				}

				// Actualizar la autenticación de la cámara si se proporciona nueva información
				if (authCamera) {
					await prisma.authCamera.update({
						where: { id: existingCamera.authCameraId },
						data: {
							...authCamera,
							rtspPort: authCamera.rtspPort.toString(),
							httpPort: authCamera.httpPort.toString(),
						},
					});
				}

				// Actualizar la cámara
				const updatedCamera = await prisma.camera.update({
					where: { id },
					data: {
						name: name ?? existingCamera.name,
						active: active ?? existingCamera.active,
						hasPTZ: hasPTZ ?? existingCamera.hasPTZ,
						roomId: roomId ?? existingCamera.roomId,
					},
				});

				// Actualizar servicios de streaming para la cámara
				// await this.camerasUtils.updateCameraOnlineScript(
				//   id,
				//   `rtsp://${existingCamera.authCamera.userName}:${existingCamera.authCamera.password}@${existingCamera.authCamera.ipAddress}:${existingCamera.authCamera.rtspPort}${existingCamera.authCamera.endPointRtsp}`
				// );

				return updatedCamera;
			});

			// Validar los movimientos PTZ
			if (hasPTZ && movementsPTZ?.length > 0) {
				// Validar nombres duplicados
				const names = movementsPTZ.map(movement => movement.name);
				const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

				if (duplicateNames.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `${Messages.ERROR_UPDATING} "Hay nombres de movimientos PTZ duplicados: ${duplicateNames.join(', ')}."`,
					});
				}

				// Validar órdenes duplicados
				const orders = movementsPTZ.map(movement => movement.order);
				const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);

				if (duplicateOrders.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `${Messages.ERROR_UPDATING} "Hay órdenes de movimientos PTZ duplicadas: ${duplicateOrders.join(', ')}."`,
					});
				}

				// Eliminar los movimientos PTZ anteriores
				await this.prisma.movementsPTZ.deleteMany({
					where: { cameraId: id },
				});

				// Insertar los movimientos PTZ nuevos
				await Promise.all(
					movementsPTZ.map((movement) =>
						this.prisma.movementsPTZ.create({
							data: {
								name: movement.name,
								order: movement.order,
								endPoint: movement.endPoint,
								cameraId: id,
							},
						})
					)
				);
			}

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [result],
			});

		} catch (error) {
			console.log(error)
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async remove(id: string) {
		try {
			await this.prisma.$transaction(async (prisma) => {
				// Verificar si la cámara existe
				const actualCamera = await prisma.camera.findUnique({
					where: { id },
					include: {
						authCamera: true
					},
				});
				if (!actualCamera) {
					this.functions.generateResponseApi({
						status: HttpStatus.NOT_FOUND,
						message: Messages.NO_DATA_FOUND,
					});
				}

				// Verificar si la cámara tiene online asociadas y activos
				const associatedCameraOnline = await this.prisma.cameraOnline.findFirst({
					where: { cameraId: id, current: true },
				});

				if (associatedCameraOnline) {
					this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_CREATING} "Existe un servicio con streaming activo asociado a esta cámara, primero remuevalo para continuar".`,
					});
				}

				// Eliminar los movimientos cameraOnline asociados
				await prisma.cameraOnline.deleteMany({
					where: { cameraId: id },
				});
				
				// Eliminar los movimientos PTZ de la cámara
				await prisma.movementsPTZ.deleteMany({
					where: { cameraId: id },
				});

				// Eliminar los servicios online de la cámara
				await prisma.cameraOnline.deleteMany({
					where: { cameraId: id },
				});

				// Eliminar la cámara
				await prisma.camera.delete({
					where: { id },
				});

				// Eliminar la autenticación de la cámara
				if (actualCamera.authCameraId) {
					await prisma.authCamera.delete({
						where: { id: actualCamera.authCameraId },
					});
				}
			});

			// Respuesta de éxito
			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_DELETED,
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async cameraFail(id: string, message: string) {
		try {
			const camera = await this.prisma.camera.findUnique({
				where: { id }
			});

			if (!camera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.NO_DATA_FOUND} Cámara no encontrada.`,
				});
			}

			const cameraOnline = await this.prisma.cameraOnline.findFirst({
				where: {
					cameraId: id,
					current: true
				}
			})

			if (!cameraOnline) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.NO_DATA_FOUND} No hay un online activo para esta cámara.`,
				});
			}

			await this.prisma.cameraOnline.update({
				where: {
					id: cameraOnline.id
				},
				data: {
					status: 'FAIL',
					descriptionStatus: message
				}
			});

			// Enviar correo electrónico con la notificación
			const emailOptions = {
				to: 'auxiliar.soportetecnico@cotrafasocial.com.co', // Cambia esto por el destinatario correcto
				subject: 'Notificación de Fallo en la Cámara',
				html: this.mail.getEmailTemplate({
					title: 'Fallo en la Cámara',
					banner: null, // Puedes poner una URL de banner si quieres
					subtitle: `Cámara ID: ${id}`,
					content: 'La cámara ha fallado',
					description: `Mensaje: ${message}`,
					action: null, // Puedes agregar una acción si es necesario
					footer: 'Por favor, revisa el sistema.',
				}),
			};

			await this.mail.sendMail(emailOptions);

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}
}


// HACER:

// Si requiero una tarea en segundo plano que cada 30 segundos consulte a la base de datos y mire si hay online que hay que activar y si los hay los ejecute y si hay online para apagar y si los hay los apague con nest.js como lo hago?
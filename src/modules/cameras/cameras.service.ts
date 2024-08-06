import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import { CreateCameraDto } from './dtos/create-camera.dto';
import { UpdateCameraDto } from './dtos/update-camera.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { CameraOnlineService } from '../camerasOnline/camerasOnline.service';
import { MailService } from '../mail/mail.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class CamerasService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly functions: FunctionsService,
		private readonly cameraOnline: CameraOnlineService,
		private readonly mail: MailService,
	) { }

	async create(createCameraDto: CreateCameraDto) {
		const idCamera = uuidv4();
		const { name, active, hasPTZ, roomId, authCamera, movementsPTZ } = createCameraDto;

		try {
			const existRoom = await this.prisma.room.findUnique({
				where: { id: roomId, active: true },
				include: {
					headquarter: {
						select: {
							name: true,
						},
					},
				},
			});

			if (!existRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: "La sala asociada no existe o está inactiva.",
				});
			}

			const existCameraInRoom = await this.prisma.camera.findFirst({
				where: { roomId }
			});

			if (existCameraInRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `Ya existe una cámara asignada a la sala '${existRoom.name}' de la sede '${existRoom.headquarter.name}'. No se puede crear una nueva cámara en esta sala.`,
				});
			}

			const existCamera = await this.prisma.camera.findFirst({
				where: { name, roomId },
				include: {
					room: {
						select: {
							name: true,
							headquarter: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			});

			if (existCamera) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `Ya existe una cámara con el nombre '${name}' en la sala '${existCamera.room.name}' de la sede '${existCamera.room.headquarter.name}'.`,
				});
			}

			// Realizar la transacción para crear la cámara y la autenticación
			const result = await this.prisma.$transaction(async (prisma) => {
				const authCameraCreate = await prisma.authCamera.create({
					data: {
						...authCamera,
						rtspPort: authCamera.rtspPort.toString(),
						httpPort: authCamera.httpPort.toString(),
					},
				});

				const cameraData = await prisma.camera.create({
					data: {
						id: idCamera,
						name,
						active,
						hasPTZ,
						roomId,
						authCameraId: authCameraCreate.id,
					},
					include: {
						room: {
							select: {
								name: true,
								headquarter: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				});

				return cameraData;
			});

			if (hasPTZ && movementsPTZ?.length > 0) {
				// Validar nombres duplicados
				const names = movementsPTZ.map((movement) => movement.name);
				const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

				if (duplicateNames.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `La cámara fue creada, pero no se pudieron agregar los movimientos PTZ debido a nombres duplicados: ${duplicateNames.join(', ')}.`,
					});
				}

				// Validar órdenes duplicados
				const orders = movementsPTZ.map((movement) => movement.order);
				const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);

				if (duplicateOrders.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `La cámara fue creada, pero no se pudieron agregar los movimientos PTZ debido a órdenes duplicadas: ${duplicateOrders.join(', ')}.`,
					});
				}

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
				message: "Cámara creada con éxito.",
				data: [{ id: result.id, name: result.name, hasPTZ: result.hasPTZ, active: result.active, roomName: result.room.name, headquarterName: result.room.headquarter.name }],
			});

		} catch (error) {
			// //Eliminar los archivos para el online de la camara
			// await this.cameraOnline.removeCameraOnlineService(idCamera);

			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async findAll(query: PaginationDto) {
		try {
			const { search, page, pageSize } = query;

			const searchCondition = search && search.trim() !== ''
				? { name: { contains: search.toLowerCase() } }
				: {};

			const [cameras, total] = await this.prisma.$transaction([
				this.prisma.camera.findMany({
					where: searchCondition,
					include: {
						room: {
							select: {
								name: true,
								headquarter: {
									select: {
										name: true,
									},
								},
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

			const formattedCameras = cameras.map(camera => ({
				id: camera.id,
				name: camera.name,
				hasPTZ: camera.hasPTZ,
				active: camera.active,
				roomName: camera.room?.name || null,
				headquarterName: camera.room.headquarter?.name || null,
			}));

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: formattedCameras,
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
				where: { id },
				include: {
					authCamera: true,
					room: {
						select: {
							id: true,
							name: true,
							headquarter: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			if (!camera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
				return;
			}

			const listPTZ = camera.hasPTZ
				? await this.prisma.movementsPTZ.findMany({
					select: {
						order: true,
						name: true,
						endPoint: true,
					},
					where: { cameraId: camera.id },
				})
				: [];

			const responseData = {
				id: camera.id,
				name: camera.name,
				hasPTZ: camera.hasPTZ,
				active: camera.active,
				authCamera: {
					userName: camera.authCamera.userName,
					password: camera.authCamera.password,
					ipAddress: camera.authCamera.ipAddress,
					rtspPort: camera.authCamera.rtspPort,
					endPointRtsp: camera.authCamera.endPointRtsp,
					httpPort: camera.authCamera.httpPort,
					endPointImagePreview: camera.authCamera.endPointImagePreview,
				},
				room: {
					id: camera.room.id,
					name: camera.room.name,
				},
				headquarter: {
					id: camera.room.headquarter.id,
					name: camera.room.headquarter.name,
				},
				listPTZ: listPTZ,
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
			const camera = await this.prisma.camera.findUnique({
				where: { id },
				include: { authCamera: true },
			});

			if (!camera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			let imagePreviewBase64 = null;

			try {
				const response = await axios.get(
					`http://${camera.authCamera.userName}:${camera.authCamera.password}@${camera.authCamera.ipAddress}:${camera.authCamera.httpPort}${camera.authCamera.endPointImagePreview}`,
					{
						responseType: 'arraybuffer',
						timeout: 3000,
					}
				);

				imagePreviewBase64 = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
			} catch (error) {
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

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [{ imagePreviewBase64: imagePreviewBase64 }],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async update(id: string, updateCameraDto: UpdateCameraDto) {
		const { name, active, hasPTZ, roomId, authCamera, movementsPTZ } = updateCameraDto;

		try {
			// Verificar si la cámara existe
			const existingCamera = await this.prisma.camera.findUnique({
				where: { id },
				include: { authCamera: true }
			});

			if (!existingCamera) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "La cámara no existe."`,
				});
			}

			const existRoom = await this.prisma.room.findUnique({
				where: { id: roomId, active: true },
				include: {
					headquarter: {
						select: {
							name: true,
						},
					},
				},
			});

			if (!existRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: "La sala asociada no existe o está inactiva.",
				});
			}

			const result = await this.prisma.$transaction(async (prisma) => {

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
					include: {
						room: {
							select: {
								name: true,
								headquarter: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				});

				// Actualizar servicios de streaming para la cámara
				// await this.cameraOnline.updateCameraOnlineScript(
				// 	id,
				// 	`rtsp://${existingCamera.authCamera.userName}:${existingCamera.authCamera.password}@${existingCamera.authCamera.ipAddress}:${existingCamera.authCamera.rtspPort}${existingCamera.authCamera.endPointRtsp}`
				// );

				return updatedCamera;
			});

			if (hasPTZ && movementsPTZ?.length > 0) {
				// Validar nombres duplicados
				const names = movementsPTZ.map((movement) => movement.name);
				const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);

				if (duplicateNames.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `La cámara fue actualizada, pero no se pudieron actualizar los movimientos PTZ debido a nombres duplicados: ${duplicateNames.join(', ')}.`,
					});
				}

				// Validar órdenes duplicados
				const orders = movementsPTZ.map((movement) => movement.order);
				const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);

				if (duplicateOrders.length > 0) {
					return this.functions.generateResponseApi({
						status: HttpStatus.BAD_REQUEST,
						message: `La cámara fue actualizada, pero no se pudieron actualizar los movimientos PTZ debido a órdenes duplicadas: ${duplicateOrders.join(', ')}.`,
					});
				}

				// Eliminar los movimientos PTZ anteriores
				await this.prisma.movementsPTZ.deleteMany({
					where: { cameraId: id },
				});

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
				data: [{ id: result.id, name: result.name, hasPTZ: result.hasPTZ, active: result.active, roomName: result.room.name, headquarterName: result.room.headquarter.name }],
			});

		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async remove(id: string) {
		try {
			await this.prisma.$transaction(async (prisma) => {
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

				const associatedCameraOnline = await this.prisma.cameraOnline.findFirst({
					where: { cameraId: id, current: true },
				});

				if (associatedCameraOnline) {
					this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_CREATING} "Existe un servicio con streaming activo asociado a esta cámara, primero remuevalo para continuar".`,
					});
				}

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

				if (actualCamera.authCameraId) {
					await prisma.authCamera.delete({
						where: { id: actualCamera.authCameraId },
					});
				}
			});

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
			const camera = await this.prisma.camera.findFirst({
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
					id: id
				},
				data: {
					status: 'FAIL',
					descriptionStatus: message
				}
			});

			// Enviar correo electrónico con la notificación
			const emailOptions = {
				to: process.env.SUPPORT_EMAIL,
				subject: 'Notificación de Fallo en la Cámara',
				html: this.mail.getEmailTemplate({
					title: 'Fallo en la Cámara',
					banner: null,
					subtitle: `Cámara ID: ${id}`,
					content: 'La cámara ha fallado',
					description: `Mensaje: ${message}`,
					action: null,
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
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ServicesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly functions: FunctionsService,
	) { }

	async create(createServiceDto: CreateServiceDto) {
		const { roomId, hasStreaming, startAt, endAt } = createServiceDto;

		try {
			const existRoom = await this.prisma.room.findUnique({
				where: { id: roomId },
				select: { active: true }
			});

			if (!existRoom || !existRoom.active) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_CREATING} "La sala que se está asociando no existe o está inactiva."`,
				});
			}

			// Verificar si hay servicios existentes en la misma sala entre las fechas especificadas
			const existingService = await this.prisma.service.findFirst({
				where: {
					roomId,
					AND: [
						{ startAt: { lt: endAt } },
						{ endAt: { gt: startAt } }
					]
				}
			});

			if (existingService) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe un servicio en la sala durante el período especificado."`,
				});
			}

			const service = await this.prisma.service.create({
				data: { roomId, hasStreaming, startAt, endAt }
			});

			if (hasStreaming) {
				// Buscar una cámara asociada a la sala
				const camera = await this.prisma.camera.findFirst({
					where: { roomId },
					select: { id: true }
				});

				if (!camera) {
					return this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_CREATING} "No hay una cámara asociada a esta sala."`,
					});
				}

				// Generar y encriptar la contraseña
				const randomPassword = this.functions.generateOTP('code');
				const hashedPassword = await hash(randomPassword, 10);

				// Crear el registro en cameraOnline
				await this.prisma.cameraOnline.create({
					data: {
						cameraId: camera.id,
						endPointStreaming: `/live/${camera.id}/stream.m3u8`,
						password: hashedPassword
					}
				});

				return this.functions.generateResponseApi({
					ok: true,
					status: HttpStatus.CREATED,
					message: Messages.SUCCESSFULLY_CREATED,
					data: [
						service,
						{ password: randomPassword }
					]
				}, 'Objet');
			}

			// Respuesta para el caso sin streaming
			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [service]
			}, 'Objet');

		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	// async findAll(query: PaginationDto) {
	// 	try {
	// 		const { search, page, pageSize } = query;

	// 		const searchCondition = search && search.trim() !== ''
	// 		? { name: { contains: search.toLowerCase() } }
	// 		: {}; // No aplicar filtro si `search` es vacío o nulo

	// 		const [rooms, total] = await this.prisma.$transaction([
	// 			this.prisma.room.findMany({
	// 			  where: searchCondition, // Aplica el filtro si existe `searchCondition`
	// 			  include: {
	// 				headquarter: {
	// 				  select: {
	// 					name: true,
	// 				  },
	// 				},
	// 			  },
	// 			  orderBy: {
	// 				name: 'asc',
	// 			  },
	// 			  skip: page > 0 ? (page - 1) * pageSize : 0,
	// 			  take: pageSize,
	// 			}),
	// 			this.prisma.room.count({
	// 			  where: searchCondition, // Aplica el filtro si existe `searchCondition`
	// 			}),
	// 		  ]);


	// 		const totalPages = Math.ceil(total / query.pageSize);

	// 		if (!rooms || !rooms.length || total === 0 || totalPages === 0) {
	// 			this.functions.generateResponseApi({
	// 				status: HttpStatus.NOT_FOUND,
	// 				message: Messages.NO_DATA_FOUND,
	// 			});
	// 		}

	// 		this.functions.generateResponseApi({
	// 			ok: true,
	// 			status: HttpStatus.OK,
	// 			data: rooms,
	// 			meta: {
	// 				page,
	// 				pageSize,
	// 				totalPages,
	// 				total,
	// 				search,
	// 			},
	// 		});
	// 	} catch (error) {
	// 		if (error instanceof HttpException) throw error;
	// 		else this.functions.generateResponseApi({});
	// 	}
	// }

	// async findOne(id: string) {
	// 	try {
	// 		const room = await this.prisma.room.findUnique({
	// 			where: {
	// 				id,
	// 			},
	// 			include: { headquarter: true }
	// 		});

	// 		if (!room) {
	// 			this.functions.generateResponseApi({
	// 				status: HttpStatus.NOT_FOUND,
	// 				message: Messages.NO_DATA_FOUND,
	// 			});
	// 		}

	// 		this.functions.generateResponseApi({
	// 			ok: true,
	// 			status: HttpStatus.OK,
	// 			data: [room],
	// 		});
	// 	} catch (error) {
	// 		if (error instanceof HttpException) throw error;
	// 		else this.functions.generateResponseApi({});
	// 	}
	// }

	async update(id: string, updateServiceDto: UpdateServiceDto) {
		const { roomId, hasStreaming, startAt, endAt } = updateServiceDto;

		try {
			// Verificar si el servicio existe
			const existingService = await this.prisma.service.findUnique({
				where: { id }
			});

			if (!existingService) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "El servicio que se está intentando actualizar no existe."`,
				});
			}

			// Verificar si la habitación existe y está activa
			const existRoom = await this.prisma.room.findUnique({
				where: { id: roomId },
				select: { active: true }
			});

			if (!existRoom || !existRoom.active) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "La sala que se está asociando no existe o está inactiva."`,
				});
			}

			// Verificar si hay servicios existentes en la misma sala entre las fechas especificadas
			const conflictingService = await this.prisma.service.findFirst({
				where: {
					roomId,
					AND: [
						{ startAt: { lt: endAt } },
						{ endAt: { gt: startAt } },
						{ id: { not: id } }
					]
				}
			});

			if (conflictingService) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_UPDATING} "Ya existe un servicio en la sala durante el período especificado."`,
				});
			}

			// Actualizar el servicio
			const updatedService = await this.prisma.service.update({
				where: { id },
				data: { roomId, hasStreaming, startAt, endAt }
			});

			if (hasStreaming) {
				// Buscar una cámara asociada a la sala
				const camera = await this.prisma.camera.findFirst({
					where: { roomId },
					select: { id: true }
				});

				if (!camera) {
					return this.functions.generateResponseApi({
						status: HttpStatus.CONFLICT,
						message: `${Messages.ERROR_UPDATING} "No hay una cámara asociada a esta sala."`,
					});
				}

				// Generar y encriptar la nueva contraseña si es necesario
				const randomPassword = this.functions.generateOTP('password');
				const hashedPassword = await hash(randomPassword, 10);

				await this.prisma.cameraOnline.create({
					data: {
						cameraId: camera.id,
						endPointStreaming: `/live/${camera.id}/stream.m3u8`,
						password: hashedPassword
					}
				});

				this.functions.generateResponseApi({
					ok: true,
					status: HttpStatus.OK,
					message: Messages.SUCCESSFULLY_UPDATED,
					data: [
						updatedService,
						{ password: randomPassword }
					]
				}, 'Objet');
			}

			// Respuesta para el caso sin streaming
			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [updatedService]
			}, 'Objet');

		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	// async remove(id: string) {
	// 	try {
	// 		// Verificar si la sala existe
	// 		const actualRoom = await this.prisma.room.findUnique({
	// 		where: { id },
	// 		});

	// 		if (!actualRoom) {
	// 			this.functions.generateResponseApi({
	// 				status: HttpStatus.NOT_FOUND,
	// 				message: Messages.NO_DATA_FOUND,
	// 			});
	// 		}

	// 		// Verificar si la sala tiene cámaras asociadas
	// 		const associatedCameras = await this.prisma.camera.findFirst({
	// 		where: { roomId: id },
	// 		});

	// 		if (associatedCameras) {
	// 			this.functions.generateResponseApi({
	// 				status: HttpStatus.CONFLICT,
	// 				message: `${Messages.ERROR_CREATING} "Existen camaras asociadas a esta sala, primero remueva las cámaras para continuar".`,
	// 			});
	// 		}

	// 		// Eliminar la sala
	// 		await this.prisma.room.delete({
	// 		where: { id },
	// 		});

	// 		// Respuesta de éxito
	// 		this.functions.generateResponseApi({
	// 			ok: true,
	// 			status: HttpStatus.OK,
	// 			message: Messages.SUCCESSFULLY_DELETED,
	// 		});
	// 	} catch (error) {
	// 		if (error instanceof HttpException) throw error;
	// 		else this.functions.generateResponseApi({});
	// 	}
	// }
}
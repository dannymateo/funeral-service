import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class RoomsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly functions: FunctionsService,
	) { }

	async create(createRoomDto: CreateRoomDto) {
		try {
			const { name, active, headquarterId } = createRoomDto;

			// Verificar si la habitación existe y está activa
			const existHeadquarter = await this.prisma.headquarter.findUnique({
				where: { id: headquarterId, active: true },
			});

			if (!existHeadquarter || !existHeadquarter.active) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_CREATING} "La sede que se está asociando no existe o está inactiva."`,
				});
			}

			const duplicateRoom = await this.prisma.room.findFirst({
				where: {
					name,
					headquarterId: headquarterId
				},
			});

			if (duplicateRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sala con este nombre para esta sede."`,
				});
			}

			const roomData = await this.prisma.room.create({
				data: {
					name,
					active,
					headquarterId
				},
			});

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [roomData],
			});
		} catch (error) {
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

			const [rooms, total] = await this.prisma.$transaction([
				this.prisma.room.findMany({
					where: searchCondition, // Aplica el filtro si existe `searchCondition`
					include: {
						headquarter: {
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
				this.prisma.room.count({
					where: searchCondition, // Aplica el filtro si existe `searchCondition`
				}),
			]);


			const totalPages = Math.ceil(total / query.pageSize);

			if (!rooms || !rooms.length || total === 0 || totalPages === 0) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: rooms,
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
			const room = await this.prisma.room.findUnique({
				where: {
					id,
				},
				include: { headquarter: true }
			});

			if (!room) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [room],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async update(id: string, updateRoomDto: UpdateRoomDto) {
		try {
			const { name, active, headquarterId } = updateRoomDto;

			// Verificar si la habitación existe y está activa
			const existHeadquarter = await this.prisma.headquarter.findUnique({
				where: { id: headquarterId, active: true },
			});

			if (!existHeadquarter || !existHeadquarter.active) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_CREATING} "La sede que se está asociando no existe o está inactiva."`,
				});
			}

			const [duplicateRoom, actualRoom] = await this.prisma.$transaction([
				this.prisma.room.findFirst({
					where: {
						name,
						headquarterId,
						id: {
							not: id,
						},
					},
				}),
				this.prisma.room.findUnique({
					where: {
						id,
					},
				}),
			]);

			if (duplicateRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sala con este nombre para esta sede."`,
				});
			}

			if (!actualRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "Sala no encontrada".`,
				});
			}

			const roomData = await this.prisma.room.update({
				where: {
					id,
				},
				data: {
					name,
					active,
					headquarterId
				},
			});

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [roomData]
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async remove(id: string) {
		try {
			// Verificar si la sala existe
			const actualRoom = await this.prisma.room.findUnique({
				where: { id },
			});

			if (!actualRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			// Verificar si la sala tiene cámaras asociadas
			const associatedCameras = await this.prisma.camera.findFirst({
				where: { roomId: id },
			});

			if (associatedCameras) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existen camaras asociadas a esta sala, primero remueva las cámaras para continuar".`,
				});
			}

			// Verificar si la cámara tiene online asociadas y activos
			const associatedService = await this.prisma.service.findFirst({
				where: { roomId: id, current: true },
			});

			if (associatedService) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existe un servicio activo asociado a esta sala, primero remuevalo para continuar".`,
				});
			}

			// Eliminar la sala
			await this.prisma.room.delete({
				where: { id },
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
}
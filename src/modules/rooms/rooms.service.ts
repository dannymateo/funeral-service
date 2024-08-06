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

			const existHeadquarter = await this.prisma.headquarter.findUnique({
				where: { id: headquarterId },
			});

			if (!existHeadquarter || !existHeadquarter.active) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_CREATING} "La sede asociada no existe o está inactiva."`,
				}, 'HttpException');
			}

			const duplicateRoom = await this.prisma.room.findFirst({
				where: {
					name,
					headquarterId,
				},
				include: {
					headquarter: true,
				},
			});

			if (duplicateRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sala con este nombre en la sede ${duplicateRoom.headquarter.name}."`,
				}, 'HttpException');
			}

			const roomData = await this.prisma.room.create({
				data: {
					name,
					active,
					headquarterId,
				},
				include: {
					headquarter: true,
				},
			});

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [{
					id: roomData.id,
					name: roomData.name,
					active: roomData.active,
					headquarterName: roomData.headquarter.name,
				}],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al crear la sala: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findAll(query: PaginationDto) {
		try {
			const { search, page, pageSize } = query;

			const searchCondition = search && search.trim() !== ''
				? { name: { contains: search.toLowerCase() } }
				: {};

			const [rooms, total] = await this.prisma.$transaction([
				this.prisma.room.findMany({
					where: searchCondition,
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
					where: searchCondition,
				}),
			]);

			const totalPages = Math.ceil(total / pageSize);

			if (total === 0) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				}, 'HttpException');
			}

			const formattedRooms = rooms.map(room => ({
				id: room.id,
				name: room.name,
				active: room.active,
				headquarterName: room.headquarter?.name || null,
			}));

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: formattedRooms,
				meta: {
					page,
					pageSize,
					totalPages,
					total,
					search,
				},
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al buscar salas: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findByHeadquarterId(headquarterId: string) {
		try {
			const rooms = await this.prisma.room.findMany({
				where: {
					headquarterId,
					active: true,
				},
				select: {
					id: true,
					name: true,
				},
				orderBy: {
					name: 'asc',
				},
			});

			const formattedRooms = rooms.map(room => ({
				id: room.id,
				name: room.name,
			}));

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: formattedRooms,
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al buscar salas: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findOne(id: string) {
		try {
			const room = await this.prisma.room.findUnique({
				where: {
					id,
				},
				include: {
					headquarter: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (!room) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				}, 'HttpException');
			}

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [{
					name: room.name,
					active: room.active,
					headquarter: {
						id: room.headquarter.id,
						name: room.headquarter.name,
					},
				}],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al obtener la sala: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async update(id: string, updateRoomDto: UpdateRoomDto) {
		try {
			const { name, active, headquarterId } = updateRoomDto;

			const existHeadquarter = await this.prisma.headquarter.findUnique({
				where: { id: headquarterId },
			});

			if (!existHeadquarter || !existHeadquarter.active) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_CREATING} "La sede que se está asociando no existe o está inactiva."`,
				}, 'HttpException');
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
					include: {
						headquarter: true,
					},
				}),
				this.prisma.room.findUnique({
					where: {
						id,
					},
				}),
			]);

			if (duplicateRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sala con este nombre para la sede de ${duplicateRoom.headquarter.name}."`,
				}, 'HttpException');
			}

			if (!actualRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "Sala no encontrada".`,
				}, 'HttpException');
			}

			const roomData = await this.prisma.room.update({
				where: {
					id,
				},
				data: {
					name,
					active,
					headquarterId,
				},
				include: {
					headquarter: true,
				},
			});

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [{ id: roomData.id, name: roomData.name, active: roomData.active, headquarterName: roomData.headquarter.name }],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al actualizar la sala: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async remove(id: string) {
		try {
			const actualRoom = await this.prisma.room.findUnique({
				where: { id },
			});

			if (!actualRoom) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				}, 'HttpException');
			}

			const associatedCameras = await this.prisma.camera.findFirst({
				where: { roomId: id },
			});

			if (associatedCameras) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existen cámaras asociadas a esta sala, primero remueva las cámaras para continuar."`,
				}, 'HttpException');
			}

			const associatedServices = await this.prisma.service.findMany({
				where: { roomId: id },
			});

			if (associatedServices.length > 0) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existen ${associatedServices.length} servicios asociados a esta sala, primero remuévalos para continuar."`,
				}, 'HttpException');
			}

			await this.prisma.camera.deleteMany({
				where: { roomId: id },
			});

			await this.prisma.service.deleteMany({
				where: { roomId: id },
			});

			await this.prisma.room.delete({
				where: { id },
			});

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_DELETED,
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al eliminar la sala: ${error.message}`,
				}, 'HttpException');
			}
		}
	}
}
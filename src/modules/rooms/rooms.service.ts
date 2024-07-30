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
	) {}

	async create(createRoomDto: CreateRoomDto, ip: string) {
		try {
			const { name, active } = createRoomDto;

			const duplicateRoom = await this.prisma.room.findUnique({
				where: {
					name,
				},
			});

			if (duplicateRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "There is already a room with this name".`,
				});
			}

			const roomData = await this.prisma.room.create({
				data: {
					name,
					active
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
			  select: {
				id: true,
				name: true,
				active: true,
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
			const category = await this.prisma.room.findUnique({
				where: {
					id,
				},
				select: {
					id: true,
					name: true,
					active: true
				},
			});

			if (!category) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [category],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async update(id: string, updateRoomDto: UpdateRoomDto, ip: string) {
		try {
			const { name, active } = updateRoomDto;

			const [duplicateRoom, actualRoom] = await this.prisma.$transaction([
				this.prisma.room.findFirst({
				  where: {
					name,
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
					message: `${Messages.ERROR_UPDATING} "There is already a room with this name".`,
				});
			}

			if (!actualRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "Room not found".`,
				});
			}

			const categoryData = await this.prisma.room.update({
				where: {
					id,
				},
				data: {
					name,
					active
				},
			});

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [categoryData],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async remove(id: string, ip: string) {
		try {
			const actualRoom = await this.prisma.room.findUnique({
				where: {
					id,
				},
			});

			if (!actualRoom) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_DELETING} "Room not found".`,
				});
			}

			const roomData = await this.prisma.room.delete({
				where: {
					id,
				},
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
}
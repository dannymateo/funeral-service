import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { CreateHeadquarterDto } from './dto/create-headquarter.dto';
import { UpdateHeadquarterRDto } from './dto/update-headquarter.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FunctionsService } from '../functions/functions.service';
import { Messages } from 'src/common/enums';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class headquartersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly functions: FunctionsService,
	) { }

	async create(createHeadquarterDto: CreateHeadquarterDto) {
		try {
			const { name, active } = createHeadquarterDto;

			const duplicateHeadquarter = await this.prisma.headquarter.findUnique({
				where: { name },
			});

			if (duplicateHeadquarter) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sede con este nombre."`,
				}, 'HttpException');
			}

			const headquarterData = await this.prisma.headquarter.create({
				data: { name, active },
			});

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [{
					id: headquarterData.id,
					name: headquarterData.name,
					active: headquarterData.active,
				}],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al crear la sede: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findAll(query: PaginationDto) {
		try {
			const { search, page = 1, pageSize = 10 } = query;

			const searchCondition = search && search.trim() !== ''
				? { name: { contains: search.toLowerCase() } }
				: {};

			const [headquarters, total] = await this.prisma.$transaction([
				this.prisma.headquarter.findMany({
					where: searchCondition,
					select: {
						id: true,
						name: true,
						active: true,
					},
					orderBy: {
						name: 'asc',
					},
					skip: (page - 1) * pageSize,
					take: pageSize,
				}),
				this.prisma.headquarter.count({
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

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: headquarters,
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
					message: `Error al obtener las sedes: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findActive() {
		try {
			const headquarters = await this.prisma.headquarter.findMany({
				where: {
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

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: headquarters,
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al obtener las sedes: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async findOne(id: string) {
		try {
			const headquarter = await this.prisma.headquarter.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					active: true,
				},
			});

			if (!headquarter) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				}, 'HttpException');
			}

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [headquarter],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al obtener la sede: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async update(id: string, updateHeadquarterDto: UpdateHeadquarterRDto) {
		try {
			const { name, active } = updateHeadquarterDto;

			const [duplicateHeadquarter, actualHeadquarter] = await this.prisma.$transaction([
				this.prisma.headquarter.findFirst({
					where: {
						name,
						id: {
							not: id,
						},
					},
				}),
				this.prisma.headquarter.findUnique({
					where: {
						id,
					},
				}),
			]);

			if (duplicateHeadquarter) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sede con este nombre."`,
				}, 'HttpException');
			}

			if (!actualHeadquarter) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "Sede no encontrada."`,
				}, 'HttpException');
			}

			const headquarterData = await this.prisma.headquarter.update({
				where: {
					id,
				},
				data: {
					name,
					active,
				},
			});

			return this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [{ id: headquarterData.id, name: headquarterData.name, active: headquarterData.active }],
			}, 'Objet');
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				return this.functions.generateResponseApi({
					ok: false,
					status: HttpStatus.INTERNAL_SERVER_ERROR,
					message: `Error al actualizar la sede: ${error.message}`,
				}, 'HttpException');
			}
		}
	}

	async remove(id: string) {
		try {
			const actualHeadquarter = await this.prisma.headquarter.findUnique({
				where: { id },
			});

			if (!actualHeadquarter) {
				return this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				}, 'HttpException');
			}

			const associatedRooms = await this.prisma.room.findFirst({
				where: { headquarterId: id },
			});

			if (associatedRooms) {
				return this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existen salas asociadas a esta sede, primero remueva las salas para continuar".`,
				}, 'HttpException');
			}

			await this.prisma.headquarter.delete({
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
					message: `Error al eliminar la sede: ${error.message}`,
				}, 'HttpException');
			}
		}
	}
}
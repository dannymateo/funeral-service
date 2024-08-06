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
	) {}

	async create(createHeadquarterDto: CreateHeadquarterDto) {
		try {
			const { name, active } = createHeadquarterDto;

			const duplicateHeadquarter = await this.prisma.headquarter.findUnique({
				where: {
					name,
				},
			});

			if (duplicateHeadquarter) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sede con este nombre."`,
				});
			}

			const headquarterData = await this.prisma.headquarter.create({
				data: {
					name,
					active
				},
			});

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.CREATED,
				message: Messages.SUCCESSFULLY_CREATED,
				data: [{id: headquarterData.id, name: headquarterData.name, active: headquarterData.active}],
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
			  skip: page > 0 ? (page - 1) * pageSize : 0,
			  take: pageSize,
			}),
			this.prisma.headquarter.count({
			  where: searchCondition,
			}),
		  ]);

			const totalPages = Math.ceil(total / query.pageSize);

			if (!headquarters || !headquarters.length || total === 0 || totalPages === 0) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
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
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async findOne(id: string) {
		try {
			const headquarter = await this.prisma.headquarter.findUnique({
				where: {
					id,
				},
				select: {
					id: true,
					name: true,
					active: true
				},
			});

			if (!headquarter) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				data: [headquarter],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
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
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Ya existe una sede con este nombre."`,
				});
			}

			if (!actualHeadquarter) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: `${Messages.ERROR_UPDATING} "Sede no encontrada".`,
				});
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

			this.functions.generateResponseApi({
				ok: true,
				status: HttpStatus.OK,
				message: Messages.SUCCESSFULLY_UPDATED,
				data: [{id: headquarterData.id, name: headquarterData.name, active: headquarterData.active}],
			});
		} catch (error) {
			if (error instanceof HttpException) throw error;
			else this.functions.generateResponseApi({});
		}
	}

	async remove(id: string) {
		try {
			const actualHeadquarter = await this.prisma.headquarter.findUnique({
			where: { id },
			});

			if (!actualHeadquarter) {
				this.functions.generateResponseApi({
					status: HttpStatus.NOT_FOUND,
					message: Messages.NO_DATA_FOUND,
				});
			}

			const associatedRooms = await this.prisma.room.findFirst({
			where: { headquarterId: id },
			});

			if (associatedRooms) {
				this.functions.generateResponseApi({
					status: HttpStatus.CONFLICT,
					message: `${Messages.ERROR_CREATING} "Existen salas asociadas a esta cámara, primero remueva las cámaras para continuar".`,
				});
			}

			await this.prisma.headquarter.delete({
			where: { id },
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
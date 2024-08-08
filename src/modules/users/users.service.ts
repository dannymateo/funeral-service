// import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { compare, hash } from 'bcrypt';

// import { CreateUserDto } from './dtos/create-user.dto';
// import { UpdateUserDto } from './dtos/update-user.dto';
// import { PrismaService } from '../prisma/prisma.service';
// import { FunctionsService } from '../functions/functions.service';
// import { UserJwtInterface } from 'src/common/interfaces';
// import { Actions, Messages } from '../../common/enums';
// import { PaginationDto } from 'src/common/dtos/pagination.dto';
// import { MailService } from '../mail/mail.service';

// @Injectable()
// export class UsersService {
// 	constructor(
// 		private readonly prisma: PrismaService,
// 		private readonly functions: FunctionsService,
// 		private readonly mailer: MailService,
// 		private readonly config: ConfigService,
// 	) {}

// 	async create(createUserDto: CreateUserDto, userJWT: UserJwtInterface, ip: string) {
// 		try {
// 			const { roleId, name, email, active } =
// 				createUserDto;

// 			const duplicateUser = await this.prisma.user.findFirst({
// 				where: {
// 					name,
// 				},
// 			});

// 			if (duplicateUser) {
// 				this.functions.generateResponseApi({
// 					status: HttpStatus.CONFLICT,
// 					message: `${Messages.ERROR_CREATING} "Nombre no disponible".`,
// 				});
// 			}

// 			const randomPassword = this.functions.generateOTP('password');
// 			const hashedPassword = await hash(randomPassword, 10);
// 			const userData = await this.prisma.user.create({
// 				data: {
// 					roleId,
// 					name,
// 					email,
// 					password: hashedPassword,
// 					active,
// 				},
//                 Include: {
//                     role: true
//                 }
// 			});

// 			const emailResponse = await this.mailer.sendMail({
// 				from: { name: 'Cotrafa Social', address: this.config.get('SMTP_USER') },
// 				to: [userData.email],
// 				subject: 'Acceso a tu cuenta',
// 				text: 'Acceso a tu cuenta',
// 				html: this.mailer.getEmailTemplate({
// 					title: `Hola ${userData.name}!`,
// 					subtitle:
// 						'Bienvenido a Cotrafa Social Connect!<br /> Estamos felices que tengas una cuenta con nosotros, tu cuenta en Cotrafa Social Connect ya la puedes usar.',
// 					content: `Tu nombre de usuario es:
// 								<br />
// 							  <span style="font-size: 20px; color: #000;">${userData.email}</span>
// 								<br />
// 							  Your password is:
// 								<br /> 
// 							  <span style="font-size: 20px; color: #000;">${randomPassword}</span>`,
// 					description:
// 						'Utiliza las credenciales anteriores para acceder a su cuenta. Recuerda que debes cambiar la contraseña cuando inicies sesión.',

// 					footer: 'Si tienes algún problema, comuníquese con nuestro equipo de soporte, estamos aquí para ayudarlo.',
// 				}),
// 				priority: 'high',
// 			});

// 			if (!emailResponse.ok) {
// 				await this.prisma.user.delete({
// 					where: {
// 						id: userData.id,
// 					},
// 				});

// 				this.functions.generateResponseApi({
// 					status: HttpStatus.INTERNAL_SERVER_ERROR,
// 					message: `${Messages.ERROR_CREATING} "Fallo al enviar el email al usuario."`,
// 				});
// 			}

// 			return this.functions.generateResponseApi({
// 				ok: true,
// 				status: HttpStatus.CREATED,
// 				message: Messages.SUCCESSFULLY_CREATED,
// 				data: [{
// 					name: userData.name,
// 					email: userData.name,
// 					active: userData.active,
//                     roleName: userData.role.name
//                 }],
// 			}, 'Objet');
// 		} catch (error) {
// 			if (error instanceof HttpException) throw error;
// 			else this.functions.generateResponseApi({});
// 		}
// 	}

// 	async findAll(query: PaginationDto) {
// 		try {
// 			const { search, page, pageSize } = query;

// 			const [users, total] = await this.prisma.$transaction([
// 				this.prisma.user.findMany({
// 					where: {
// 						OR: [
// 							{ name: { contains: search, mode: 'insensitive' } },
// 							{ email: { contains: search, mode: 'insensitive' } },
// 						],
// 					},
// 					select: {
// 						id: true,
// 						role: {
// 							select: {
// 								id: true,
// 								name: true,
// 							},
// 						},
// 						name: true,
// 						email: true,
// 						active: true,
// 					},
// 					orderBy: {
// 						name: 'asc',
// 					},
// 					skip: page > 0 ? (page - 1) * pageSize : 0,
// 					take: pageSize,
// 				}),
// 				this.prisma.user.count({
// 					where: {
// 						OR: [
// 							{ name: { contains: search, mode: 'insensitive' } },
// 							{ email: { contains: search, mode: 'insensitive' } },
// 						],
// 					},
// 				}),
// 			]);

// 			const totalPages = Math.ceil(total / query.pageSize);

// 			if (!users || !users.length || total === 0 || totalPages === 0) {
// 				return this.functions.generateResponseApi({
// 					status: HttpStatus.NOT_FOUND,
// 					message: Messages.NO_DATA_FOUND,
// 				}, 'Objet');
// 			}

// 			const formattedUsers = users.map(user => ({
// 				id: user.id,
// 				name: user.name,
// 				email: user.email,
// 				active: user.active,
// 				roleName: user.role?.name || null,
// 			}));

// 			return this.functions.generateResponseApi({
// 				ok: true,
// 				status: HttpStatus.OK,
// 				data: formattedUsers,
// 				meta: {
// 					page,
// 					pageSize,
// 					totalPages,
// 					total,
// 					search,
// 				},
// 			}, 'Objet');
// 		} catch (error) {
// 			if (error instanceof HttpException) throw error;
// 			else this.functions.generateResponseApi({});
// 		}
// 	}

// 	// async findList() {
// 	// 	try {
// 	// 		const usersList = await this.prisma.user.findMany({
// 	// 			where: {
// 	// 				active: true,
// 	// 			},
// 	// 			select: {
// 	// 				id: true,
// 	// 				name: true,
// 	// 			},
// 	// 			orderBy: {
// 	// 				name: 'asc',
// 	// 			},
// 	// 		});

// 	// 		if (!usersList || !usersList.length) {
// 	// 			this.functions.generateResponseApi({
// 	// 				status: HttpStatus.NOT_FOUND,
// 	// 				message: Messages.NO_DATA_FOUND,
// 	// 			});
// 	// 		}

// 	// 		this.functions.generateResponseApi({
// 	// 			ok: true,
// 	// 			status: HttpStatus.OK,
// 	// 			data: usersList,
// 	// 		});
// 	// 	} catch (error) {
// 	// 		if (error instanceof HttpException) throw error;
// 	// 		else this.functions.generateResponseApi({});
// 	// 	}
// 	// }

// 	// async findOne(id: string) {
// 	// 	try {
// 	// 		const user = await this.prisma.user.findUnique({
// 	// 			where: {
// 	// 				id,
// 	// 			},
// 	// 			select: {
// 	// 				id: true,
// 	// 				role: {
// 	// 					select: {
// 	// 						id: true,
// 	// 						name: true,
// 	// 					},
// 	// 				},
// 	// 				gender: {
// 	// 					select: {
// 	// 						id: true,
// 	// 						name: true,
// 	// 					},
// 	// 				},
// 	// 				name: true,
// 	// 				document: true,
// 	// 				phone: true,
// 	// 				birthdate: true,
// 	// 				email: true,
// 	// 				imageUrl: true,
// 	// 				active: true,
// 	// 				createdAt: true,
// 	// 				updatedAt: true,
// 	// 			},
// 	// 		});

// 	// 		if (!user) {
// 	// 			this.functions.generateResponseApi({
// 	// 				status: HttpStatus.NOT_FOUND,
// 	// 				message: Messages.NO_DATA_FOUND,
// 	// 			});
// 	// 		}

// 	// 		this.functions.generateResponseApi({
// 	// 			ok: true,
// 	// 			status: HttpStatus.OK,
// 	// 			data: [user],
// 	// 		});
// 	// 	} catch (error) {
// 	// 		if (error instanceof HttpException) throw error;
// 	// 		else this.functions.generateResponseApi({});
// 	// 	}
// 	// }

// 	// async update(id: string, updateUserDto: UpdateUserDto, userJWT: UserJwtInterface, ip: string) {
// 	// 	try {
// 	// 		const { roleId, genderId, name, document, phone, birthdate, email, imageUrl, active } =
// 	// 			updateUserDto;

// 	// 		const [duplicateUser, actualUser] = await this.prisma.$transaction([
// 	// 			this.prisma.user.findFirst({
// 	// 				where: {
// 	// 					email,
// 	// 					id: {
// 	// 						not: id,
// 	// 					},
// 	// 				},
// 	// 			}),
// 	// 			this.prisma.user.findUnique({
// 	// 				where: {
// 	// 					id,
// 	// 				},
// 	// 			}),
// 	// 		]);

// 	// 		if (duplicateUser) {
// 	// 			this.functions.generateResponseApi({
// 	// 				status: HttpStatus.CONFLICT,
// 	// 				message: `${Messages.ERROR_UPDATING} "The email address is not available."`,
// 	// 			});
// 	// 		}

// 	// 		if (!actualUser) {
// 	// 			this.functions.generateResponseApi({
// 	// 				status: HttpStatus.NOT_FOUND,
// 	// 				message: `${Messages.ERROR_UPDATING} "User not found."`,
// 	// 			});
// 	// 		}

// 	// 		const userData = await this.prisma.user.update({
// 	// 			where: {
// 	// 				id,
// 	// 			},
// 	// 			data: {
// 	// 				roleId,
// 	// 				genderId,
// 	// 				name,
// 	// 				document,
// 	// 				phone,
// 	// 				birthdate,
// 	// 				email,
// 	// 				imageUrl,
// 	// 				active,
// 	// 			},
// 	// 		});

// 	// 		await this.prisma.userLog.create({
// 	// 			data: {
// 	// 				userId: userJWT.id,
// 	// 				ipAddress: ip,
// 	// 				action: Actions.UPDATE_USER,
// 	// 				details: JSON.stringify({ data: userData }),
// 	// 			},
// 	// 		});

// 	// 		this.functions.generateResponseApi({
// 	// 			ok: true,
// 	// 			status: HttpStatus.OK,
// 	// 			message: Messages.SUCCESSFULLY_UPDATED,
// 	// 			data: [userData],
// 	// 		});
// 	// 	} catch (error) {
// 	// 		if (error instanceof HttpException) throw error;
// 	// 		else this.functions.generateResponseApi({});
// 	// 	}
// 	// }

// 	// async remove(id: string, userJWT: UserJwtInterface, ip: string) {
// 	// 	try {
// 	// 		const actualUser = await this.prisma.user.findUnique({
// 	// 			where: {
// 	// 				id,
// 	// 			},
// 	// 		});

// 	// 		if (!actualUser) {
// 	// 			this.functions.generateResponseApi({
// 	// 				status: HttpStatus.NOT_FOUND,
// 	// 				message: `${Messages.ERROR_DELETING} "User not found."`,
// 	// 			});
// 	// 		}

// 	// 		const userData = await this.prisma.user.delete({
// 	// 			where: {
// 	// 				id,
// 	// 			},
// 	// 		});

// 	// 		await this.prisma.userLog.create({
// 	// 			data: {
// 	// 				userId: userJWT.id,
// 	// 				ipAddress: ip,
// 	// 				action: Actions.DELETE_USER,
// 	// 				details: JSON.stringify({ data: userData }),
// 	// 			},
// 	// 		});

// 	// 		this.functions.generateResponseApi({
// 	// 			ok: true,
// 	// 			status: HttpStatus.OK,
// 	// 			message: Messages.SUCCESSFULLY_DELETED,
// 	// 		});
// 	// 	} catch (error) {
// 	// 		if (error instanceof HttpException) throw error;
// 	// 		else this.functions.generateResponseApi({});
// 	// 	}
// 	// }
// }
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: ['http://localhost:3000'],
		methods: 'GET,POST,PUT,PATCH,DELETE',
	});
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1',
	});
	app.setGlobalPrefix('api');
	app.use(
		json({
			limit: '5mb',
		}),
	);
	app.use(
		urlencoded({
			extended: true,
			limit: '5mb',
		}),
	);

	setupSwagger(app);

	await app.listen(AppModule.port);
}
bootstrap();
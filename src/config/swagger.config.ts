import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
	const config = new DocumentBuilder()
		.addBearerAuth({ type: 'http' }, 'jwt')
		.setTitle('Funeral Serice Cotrafa Ssocial Api V1')
		.setDescription('Funeral Service Cotrafa Social API V1 documentation')
		.setVersion('1.0')
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document);
}
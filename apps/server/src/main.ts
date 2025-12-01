import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Point d'entrée de l'application NestJS.
 * 
 * Initialise l'application, configure CORS, Swagger et démarre le serveur.
 * 
 * @function bootstrap
 * @returns {Promise<void>}
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Faire confiance au reverse proxy pour les headers X-Forwarded-*
  // Cela permet à NestJS de correctement gérer les requêtes passant par un reverse proxy
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter && httpAdapter.getInstance) {
    const instance = httpAdapter.getInstance();
    if (instance && typeof instance.set === 'function') {
      instance.set('trust proxy', true);
    }
  }
  // Pas de préfixe global - le reverse proxy enlève /api avant de transmettre
  // Le frontend appelle /api/auth/login, le reverse proxy transmet /auth/login au backend
  app.setGlobalPrefix('');
  
  app.enableCors({
    origin: true, // Permet toutes les origines (le reverse proxy gère la sécurité)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Proto', 'X-Forwarded-Host'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('ArchiModeler API')
    .setDescription('API documentation for ArchiModeler - Enterprise Architecture Modeling Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}
bootstrap();

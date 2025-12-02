import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SocketIOAdapter } from './websocket/socket-io.adapter';
import type { Request, Response, NextFunction } from 'express';

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
  
  // Configurer l'adapter Socket.io personnalisé pour les WebSockets
  // IMPORTANT: Doit être configuré avant app.listen()
  // Utiliser notre adapter personnalisé pour mieux contrôler la configuration
  app.useWebSocketAdapter(new SocketIOAdapter(app));
  
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


  /**
   * Middleware de log pour aider au débogage des erreurs "Failed to fetch" derrière un reverse proxy.
   * On trace uniquement les routes critiques d'authentification et d'utilisateur afin de limiter le bruit.
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    const criticalPrefixes = ['/auth', '/users', '/bizdesign'];
    const shouldLog = criticalPrefixes.some((prefix) => req.originalUrl.startsWith(prefix));

    if (!shouldLog) {
      return next();
    }

    const startTime = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ?? req.ip;

    console.log('[HTTP Debug]', {
      requestId,
      phase: 'incoming',
      method: req.method,
      url: req.originalUrl,
      clientIp,
      host: req.headers.host,
      forwardedProto: req.headers['x-forwarded-proto'],
      forwardedHost: req.headers['x-forwarded-host'],
      userAgent: req.headers['user-agent'],
    });

    res.on('finish', () => {
      console.log('[HTTP Debug]', {
        requestId,
        phase: 'response',
        statusCode: res.statusCode,
        durationMs: Date.now() - startTime,
        contentLength: res.getHeader('content-length'),
      });
    });

    next();
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

import { createServer } from 'http';
import mongoose from 'mongoose';
import { loadRuntimeSecrets } from './config/runtimeSecrets';

const bootstrap = async (): Promise<void> => {
  try {
    await loadRuntimeSecrets();

    const [
      { app },
      { connectMongo },
      { env },
      loggerModule,
      { gatewayWebSocketServer },
      { ensureBootstrapUsers },
      { applyPendingMigrations }
    ] = await Promise.all([
      import('./app'),
      import('./config/db'),
      import('./config/env'),
      import('./config/logger'),
      import('./websocket/server'),
      import('./utils/bootstrapUsers'),
      import('./migrations/runner')
    ]);

    const logger = loggerModule.logger;

    logger.info('Starting API Gateway...');

    await connectMongo();
    logger.info('Mongo connected');

    await applyPendingMigrations(mongoose.connection);
    logger.info('Migrations ensured');

    await ensureBootstrapUsers();
    logger.info('Bootstrap users ensured');

    const httpServer = createServer(app);
    await gatewayWebSocketServer.initialize(httpServer);

    try {
      const { dashboardIntelligenceService } = await import('./services/DashboardIntelligenceService');
      dashboardIntelligenceService.startBackgroundWorker();
    } catch (error) {
      logger.warn({ error }, 'Failed to start dashboard intelligence worker');
    }

    await new Promise<void>((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(env.PORT || 8080, '0.0.0.0', () => {
        logger.info(`API Gateway listening on ${env.PORT || 8080}`);
        resolve();
      });
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Bootstrap failure', error);
    process.exit(1);
  }
};
bootstrap();

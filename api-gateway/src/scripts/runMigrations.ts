import mongoose from 'mongoose';
import { loadRuntimeSecrets } from '../config/runtimeSecrets';

const runMigrations = async () => {
  await loadRuntimeSecrets();
  const [{ env }, { logger }, { applyPendingMigrations }] = await Promise.all([
    import('../config/env'),
    import('../config/logger'),
    import('../migrations/runner')
  ]);

  await mongoose.connect(env.MONGO_URI);
  logger.info('Connected to MongoDB. Starting migrations.');

  try {
    await applyPendingMigrations(mongoose.connection);
    logger.info('Migration run completed successfully.');
  } finally {
    await mongoose.disconnect();
  }
};

runMigrations().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration run failed', error);
  process.exitCode = 1;
});

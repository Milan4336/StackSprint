import type { Connection } from 'mongoose';
import { MigrationModel } from '../models/Migration';
import { migrations } from '.';
import { logger } from '../config/logger';

export const applyPendingMigrations = async (connection: Connection): Promise<void> => {
  const appliedDocs = await MigrationModel.find({}, { migrationId: 1 }).lean().exec();
  const appliedSet = new Set(appliedDocs.map((doc) => doc.migrationId));

  for (const migration of migrations) {
    if (appliedSet.has(migration.id)) {
      logger.info({ migrationId: migration.id }, 'Migration already applied. Skipping.');
      continue;
    }

    logger.info({ migrationId: migration.id, description: migration.description }, 'Applying migration');
    await migration.up(connection);
    await MigrationModel.create({
      migrationId: migration.id,
      description: migration.description,
      appliedAt: new Date()
    });
    logger.info({ migrationId: migration.id }, 'Migration applied');
  }
};


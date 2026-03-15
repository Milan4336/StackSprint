import type { MigrationDefinition } from './types';

export const addUserMfaFieldsMigration: MigrationDefinition = {
  id: '20260310_add_user_mfa_fields',
  description: 'Ensure users include MFA fields and indexes for enterprise auth flows.',
  up: async (connection) => {
    const users = connection.collection('users');

    await users.updateMany(
      { mfaEnabled: { $exists: false } },
      { $set: { mfaEnabled: false } }
    );

    await users.updateMany(
      { mfaVerifiedAt: { $exists: false } },
      { $set: { mfaVerifiedAt: null } }
    );

    try {
      await users.createIndex({ mfaEnabled: 1 }, { name: 'idx_users_mfa_enabled' });
    } catch {
      // Index might already exist from prior manual runs.
    }
  }
};


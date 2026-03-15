import { addUserMfaFieldsMigration } from './20260310-add-user-mfa-fields';
import type { MigrationDefinition } from './types';

export const migrations: MigrationDefinition[] = [addUserMfaFieldsMigration];


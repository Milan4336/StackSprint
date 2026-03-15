import type { Connection } from 'mongoose';

export interface MigrationDefinition {
  id: string;
  description: string;
  up: (connection: Connection) => Promise<void>;
}


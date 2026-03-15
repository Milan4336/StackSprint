import { logger } from '../config/logger';
import { UserModel } from '../models/User';
import { comparePassword, hashPassword } from './password';

interface BootstrapUser {
  userId: string;
  email: string;
  password: string;
  role: 'admin' | 'analyst';
}

const DEFAULT_USERS: BootstrapUser[] = [
  {
    userId: 'admin-1',
    email: 'admin@fraud.local',
    password: 'StrongPassword123!',
    role: 'admin'
  },
  {
    userId: 'analyst-1',
    email: 'analyst@fraud.local',
    password: 'AnalystPassword123!',
    role: 'analyst'
  }
];

const parseBooleanEnv = (value: string | undefined): boolean | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

const shouldResetBootstrapUsers = (): boolean => {
  const override = parseBooleanEnv(process.env.BOOTSTRAP_USERS_RESET);
  if (typeof override === 'boolean') {
    return override;
  }

  // Keep local bootstrap credentials deterministic even when NODE_ENV=production in containerized runs.
  return true;
};

export const ensureBootstrapUsers = async (): Promise<void> => {
  const resetDefaults = shouldResetBootstrapUsers();

  for (const account of DEFAULT_USERS) {
    const existing = await UserModel.findOne({ email: account.email }).select('+mfaSecret').exec();
    if (!existing) {
      await UserModel.create({
        userId: account.userId,
        email: account.email,
        password: hashPassword(account.password),
        role: account.role,
        status: 'ACTIVE',
        riskScore: 0,
        mfaEnabled: false
      });
      logger.info({ email: account.email }, 'Bootstrap user created');
      continue;
    }

    if (!resetDefaults) {
      continue;
    }

    const shouldResetPassword = !comparePassword(account.password, existing.password);
    const shouldNormalizeRole = existing.role !== account.role;
    const shouldUnfreeze = existing.status !== 'ACTIVE';

    if (!shouldResetPassword && !shouldNormalizeRole && !shouldUnfreeze) {
      continue;
    }

    existing.password = shouldResetPassword ? hashPassword(account.password) : existing.password;
    existing.role = account.role;
    existing.status = 'ACTIVE';
    existing.riskScore = 0;
    existing.mfaEnabled = false;
    existing.mfaSecret = undefined;
    existing.mfaVerifiedAt = undefined;
    await existing.save();

    logger.info(
      { email: account.email, resetPassword: shouldResetPassword, role: account.role },
      'Bootstrap user normalized'
    );
  }
};

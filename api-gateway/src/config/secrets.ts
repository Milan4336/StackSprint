import axios from 'axios';
import { env } from './env';
import { logger } from './logger';

type SecretMap = Record<string, string>;

class SecretProvider {
  private cache: SecretMap | null = null;
  private loadedAt = 0;
  private readonly cacheTtlMs = 60_000;

  private parseVaultPayload(payload: any): SecretMap {
    const fromKvV2 = payload?.data?.data;
    const fromKvV1 = payload?.data;

    if (fromKvV2 && typeof fromKvV2 === 'object') {
      return Object.fromEntries(
        Object.entries(fromKvV2).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      );
    }

    if (fromKvV1 && typeof fromKvV1 === 'object') {
      return Object.fromEntries(
        Object.entries(fromKvV1).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      );
    }

    return {};
  }

  private async loadFromVault(): Promise<SecretMap> {
    if (!env.VAULT_ADDR || !env.VAULT_TOKEN) {
      logger.warn('Vault provider selected but VAULT_ADDR/VAULT_TOKEN is missing. Falling back to env secrets.');
      return {};
    }

    try {
      const response = await axios.get(`${env.VAULT_ADDR}/v1/${env.VAULT_PATH}`, {
        headers: {
          'X-Vault-Token': env.VAULT_TOKEN
        },
        timeout: 3000
      });
      return this.parseVaultPayload(response.data);
    } catch (error) {
      logger.error({ error }, 'Failed to load secrets from Vault, falling back to env.');
      return {};
    }
  }

  private async ensureCache(): Promise<void> {
    const cacheIsFresh = this.cache && Date.now() - this.loadedAt < this.cacheTtlMs;
    if (cacheIsFresh) return;

    if (env.SECRET_PROVIDER === 'vault') {
      this.cache = await this.loadFromVault();
      this.loadedAt = Date.now();
      return;
    }

    this.cache = {};
    this.loadedAt = Date.now();
  }

  async get(name: string): Promise<string | undefined> {
    await this.ensureCache();
    const cachedValue = this.cache?.[name];
    if (cachedValue) return cachedValue;
    return process.env[name];
  }
}

export const secretProvider = new SecretProvider();

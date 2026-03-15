import axios from 'axios';

type SecretMap = Record<string, string>;

const parseVaultPayload = (payload: any): SecretMap => {
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
};

export const loadRuntimeSecrets = async (): Promise<void> => {
  const provider = process.env.SECRET_PROVIDER ?? 'env';
  if (provider !== 'vault') {
    return;
  }

  const vaultAddr = process.env.VAULT_ADDR;
  const vaultToken = process.env.VAULT_TOKEN;
  const vaultPath = process.env.VAULT_PATH ?? 'secret/data/stack-sprint';

  if (!vaultAddr || !vaultToken) {
    // eslint-disable-next-line no-console
    console.warn('[runtime-secrets] SECRET_PROVIDER=vault but VAULT_ADDR/VAULT_TOKEN is missing.');
    return;
  }

  try {
    const response = await axios.get(`${vaultAddr.replace(/\/+$/, '')}/v1/${vaultPath}`, {
      headers: {
        'X-Vault-Token': vaultToken
      },
      timeout: 5000
    });

    const secrets = parseVaultPayload(response.data);
    for (const [key, value] of Object.entries(secrets)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    // eslint-disable-next-line no-console
    console.info(`[runtime-secrets] Loaded ${Object.keys(secrets).length} key(s) from Vault path: ${vaultPath}`);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('[runtime-secrets] Failed to load secrets from Vault:', error?.message ?? error);
  }
};


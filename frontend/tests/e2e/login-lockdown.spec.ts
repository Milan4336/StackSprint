import { expect, test } from '@playwright/test';

const createFakeJwt = (payload: Record<string, unknown>): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
};

const sessionToken = createFakeJwt({
  sub: 'admin-1',
  email: 'admin@fraud.local',
  role: 'admin',
  status: 'ACTIVE',
  exp: Math.floor(Date.now() / 1000) + 3600
});

const refreshedToken = createFakeJwt({
  sub: 'admin-1',
  email: 'admin@fraud.local',
  role: 'admin',
  status: 'ACTIVE',
  mfaVerified: true,
  exp: Math.floor(Date.now() / 1000) + 3600
});

test('logs in and unlocks dashboard during critical threat lockdown', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/auth/login') && method === 'POST') {
      await route.fulfill({ json: { token: sessionToken, userId: 'admin-1' } });
      return;
    }

    if (path.endsWith('/auth/me')) {
      await route.fulfill({
        json: {
          userId: 'admin-1',
          email: 'admin@fraud.local',
          role: 'admin',
          status: 'ACTIVE',
          riskScore: 12,
          mfaEnabled: true,
          mfaVerifiedAt: new Date().toISOString()
        }
      });
      return;
    }

    if (path.endsWith('/auth/mfa/status')) {
      await route.fulfill({
        json: {
          enabled: true,
          hasSecret: true,
          issuer: 'Stack Sprint Fraud Command Center',
          verifiedAt: null
        }
      });
      return;
    }

    if (path.endsWith('/auth/mfa/verify')) {
      await route.fulfill({
        json: {
          verified: true,
          verifiedAt: new Date().toISOString(),
          token: refreshedToken
        }
      });
      return;
    }

    if (path.endsWith('/dashboard/overview')) {
      await route.fulfill({
        json: {
          transactionCount: 542,
          fraudCount: 18,
          alertCount: 12,
          threatIndex: 96,
          fraudRate: 3.32,
          velocity: 1.18,
          riskDistribution: { Low: 310, Medium: 180, High: 52 },
          systemHealth: 'HEALTHY',
          lastUpdated: new Date().toISOString()
        }
      });
      return;
    }

    if (path.endsWith('/system/health')) {
      await route.fulfill({
        json: {
          timestamp: new Date().toISOString(),
          apiLatencyMs: 15,
          mlLatencyMs: 42,
          redisLatencyMs: 4,
          mongoStatus: 'UP',
          redisStatus: 'UP',
          mlStatus: 'UP',
          websocketStatus: 'UP',
          websocketClients: 1,
          containers: []
        }
      });
      return;
    }

    if (path.endsWith('/system/ml-status')) {
      await route.fulfill({
        json: {
          status: 'HEALTHY',
          failureCount: 0,
          lastLatencyMs: 42,
          lastError: null,
          circuitOpenUntil: null
        }
      });
      return;
    }

    if (path.endsWith('/transactions/stats')) {
      await route.fulfill({
        json: {
          fraudRate: 3.32,
          avgRiskScore: 42,
          highRiskUsers: [],
          totalTransactions: 542,
          fraudTransactions: 18
        }
      });
      return;
    }

    if (path.endsWith('/transactions/query')) {
      await route.fulfill({
        json: { data: [], total: 0, page: 1, limit: 25, pages: 0 }
      });
      return;
    }

    if (path.endsWith('/transactions') || path.endsWith('/alerts') || path.endsWith('/alerts/live') || path.endsWith('/explanations') || path.endsWith('/devices/intelligence')) {
      await route.fulfill({ json: [] });
      return;
    }

    if (path.endsWith('/cases')) {
      await route.fulfill({
        json: { data: [], total: 0, page: 1, limit: 25, pages: 0 }
      });
      return;
    }

    if (path.endsWith('/graph')) {
      await route.fulfill({ json: { nodes: [], links: [], clusters: [] } });
      return;
    }

    if (path.endsWith('/graph/analytics')) {
      await route.fulfill({
        json: {
          nodeCount: 0,
          edgeCount: 0,
          highRiskEntities: 0,
          densestClusterSize: 0
        }
      });
      return;
    }

    await route.fulfill({ json: {} });
  });

  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@fraud.local');
  await page.getByLabel('Password').fill('StrongPassword123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('**/dashboard/overview', { timeout: 20_000 });
  await expect(page.getByText('Threat Lockdown Active')).toBeVisible({ timeout: 20_000 });

  await page.getByLabel('Authenticator Code').fill('123456');
  await page.getByRole('button', { name: 'Verify & Unlock' }).click();

  await expect(page.getByText('Threat Lockdown Active')).toBeHidden({ timeout: 10_000 });
});


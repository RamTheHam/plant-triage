import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// Optional local browser endpoint when the default Chromium download is unavailable.
const connect = process.env.E2E_CDP_ENDPOINT
  ? { cdpEndpoint: async () => process.env.E2E_CDP_ENDPOINT! } : undefined;
const app = {
  url: 'http://127.0.0.1:0',
  command: {
    executable: 'python3',
    args: ['-m', 'http.server', '{port}', '--bind', '127.0.0.1'],
    log: '.e2e/logs/app.log',
  },
};
export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    { name: 'desktop', engine: web({ connect, viewport: { width: 1280, height: 800 } }), app },
    { name: 'mobile', engine: web({ connect, viewport: { width: 390, height: 844 } }), app },
  ],
  workers: 1,
  retries: 0,
  actionTimeout: 5000,
  assertionTimeout: 3000,
  cache: 'off',
  trace: 'retain-on-failure',
  reporters: ['list', 'junit', 'markdown'],
} satisfies E2EConfig;

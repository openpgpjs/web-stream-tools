import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const testFilesToInclude = {
  browser: ['test/**/{browser,common}.test.ts'],
  node: ['test/**/{node,common}.test.ts']
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: testFilesToInclude.node,
          testTimeout: 30000,
          typecheck: {
            enabled: true,
            include: testFilesToInclude.node, // typechecking is run over these files only
          },
        },
      },
      {
        test: {
          name: 'browser',
          include: testFilesToInclude.browser,
          testTimeout: 30000,
          typecheck: {
            enabled: true,
            include: testFilesToInclude.browser // typechecking is run over these files only
          },
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }]
          }
        },
      },
    ]
  }
});

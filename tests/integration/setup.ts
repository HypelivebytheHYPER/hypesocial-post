// Integration test setup
import { beforeAll, afterAll } from 'vitest';

// Verify API is accessible before running tests
beforeAll(async () => {
  const apiUrl = process.env.TEST_API_URL || 'http://localhost:3000/api';

  try {
    const response = await fetch(`${apiUrl}/posts`);
    if (!response.ok) {
      console.warn(`⚠️ API returned ${response.status}. Make sure dev server is running: pnpm dev`);
    } else {
      console.log('✅ API is accessible');
    }
  } catch (error) {
    console.error(`❌ Cannot connect to API at ${apiUrl}`);
    console.error('Make sure to run: pnpm dev');
    throw new Error('API not accessible', { cause: error });
  }
});

afterAll(() => {
  console.log('✅ Integration tests complete');
});

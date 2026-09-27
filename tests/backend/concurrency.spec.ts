import { test, expect } from '@playwright/test';

test('concurrent requests preserve case uniqueness and account isolation', async ({ playwright }) => {
  const contexts = [];
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZtQAAAAASUVORK5CYII=', 'base64');
  try {
    for (let account = 0; account < 3; account++) {
      const context = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8010', extraHTTPHeaders: { Origin: 'http://127.0.0.1:8010', Accept: 'application/json' } });
      contexts.push(context);
      await context.get('/sanctum/csrf-cookie');
      const csrf = decodeURIComponent((await context.storageState()).cookies.find(c => c.name === 'XSRF-TOKEN')!.value);
      const registration = await context.post('/api/v1/auth/register', { headers: { 'X-XSRF-TOKEN': csrf }, multipart: { name: 'Synthetic Resident', nameArabic: 'مقيم تجريبي', email: `concurrency-${Date.now()}-${account}@example.com`, password: 'synthetic-password-123', password_confirmation: 'synthetic-password-123', dob: '1995-01-01', idNumber: `SAMPLE-${account}`, consent: '1', locale: 'en', idPhoto: { name: 'sample.png', mimeType: 'image/png', buffer: png }, extract: { name: 'sample.png', mimeType: 'image/png', buffer: png } } });
      expect(registration.status()).toBe(201);
    }
    const timings: number[] = [];
    const outcomes = await Promise.all(contexts.map(async context => {
      const csrf = decodeURIComponent((await context.storageState()).cookies.find(c => c.name === 'XSRF-TOKEN')!.value);
      const responses = await Promise.all(Array.from({ length: 8 }, async () => {
        const start = performance.now();
        const response = await context.post('/api/v1/cases', { headers: { 'X-XSRF-TOKEN': csrf }, data: { serviceId: 'passport' } });
        timings.push(performance.now() - start);
        expect([200, 201]).toContain(response.status());
        return (await response.json()).data.id;
      }));
      expect(new Set(responses).size).toBe(1);
      const list = await context.get('/api/v1/cases');
      expect((await list.json()).data).toHaveLength(1);
      return responses[0];
    }));
    expect(new Set(outcomes).size).toBe(3);
    for (let index = 0; index < contexts.length; index++) {
      expect((await contexts[index].get(`/api/v1/cases/${outcomes[(index + 1) % 3]}`)).status()).toBe(404);
    }
    timings.sort((a, b) => a - b);
    console.log(`Local smoke: 3 accounts, 24 concurrent case requests, p95=${Math.round(timings[Math.ceil(timings.length * 0.95) - 1])}ms. PHP development-server result, not production capacity.`);
  } finally {
    await Promise.all(contexts.map(context => context.dispose()));
  }
});

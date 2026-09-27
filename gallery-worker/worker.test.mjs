import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import worker from './worker.mjs';

const env = {
  ALLOWED_ORIGIN: 'https://buildmybeast.com', CLOUD_NAME: 'example', CLOUD_API_KEY: 'public-key',
  CLOUD_API_SECRET: 'test-secret', CLOUD_SIGNED_PRESET: 'review', TURNSTILE_SECRET: 'test-turnstile',
  UPLOAD_RATE: { limit: async () => ({ success: true }) }, GLOBAL_RATE: { limit: async () => ({ success: true }) }
};
let calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'buildmybeast.com' });
  const body = options.body;
  const signed = `context=${body.get('context')}&timestamp=${body.get('timestamp')}&upload_preset=${body.get('upload_preset')}`;
  assert.equal(body.get('signature'), createHash('sha1').update(signed + env.CLOUD_API_SECRET).digest('hex'));
  return Response.json({ public_id: 'pending/example' });
};
try {
  const photo = new File([Uint8Array.from([0xff, 0xd8, 0xff, ...Array(120).fill(0)])], 'truck.jpg', { type: 'image/jpeg' });
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: 'Trail Truck', vehicle: '2005 Chevrolet Tahoe', category: 'offroad', mods: 'Lift and tires', turnstile: 'test-token' })) form.set(key, value);
  form.set('file', photo);
  const request = new Request('https://upload.example/upload', { method: 'POST', body: form, headers: { Origin: env.ALLOWED_ORIGIN, 'CF-Connecting-IP': '203.0.113.5' } });
  const result = await worker.fetch(request, env);
  assert.equal(result.status, 202);
  assert.equal(calls.length, 2);
  const badOrigin = await worker.fetch(new Request('https://upload.example/upload', { method: 'POST', headers: { Origin: 'https://evil.example' } }), env);
  assert.equal(badOrigin.status, 403);
  const denied = await worker.fetch(new Request('https://upload.example/upload', { method: 'POST', headers: { Origin: env.ALLOWED_ORIGIN } }), { ...env, UPLOAD_RATE: { limit: async () => ({ success: false }) } });
  assert.equal(denied.status, 429);
  console.log('Gallery upload gate checks passed');
} finally { globalThis.fetch = originalFetch; }

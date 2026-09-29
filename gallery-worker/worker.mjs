const MAX_IMAGE = 3 * 1024 * 1024;
const MAX_PHOTOS = 3;
const MAX_REQUEST = MAX_IMAGE * MAX_PHOTOS + 250_000;
const CATEGORIES = new Set(['offroad', 'street', 'audio', 'custom']);

function reply(message, status, origin) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Cache-Control': 'no-store' }
  });
}
async function limitedBody(request) {
  if (!request.body) throw Error('empty');
  const reader = request.body.getReader(), chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST) { await reader.cancel(); throw Error('large'); }
    chunks.push(value);
  }
  return new Blob(chunks);
}
function clean(value, max) {
  return String(value || '').trim().replace(/[|=\r\n\x00-\x1f]/g, ' ').slice(0, max);
}
function imageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}
async function sha1(text) {
  const bytes = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function approvedFeed(request, env) {
  if (!env.CLOUD_NAME || !env.CLOUD_API_KEY || !env.CLOUD_API_SECRET) return reply('Gallery unavailable', 503, env.ALLOWED_ORIGIN);
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(new URL('/approved-albums-v1', request.url).href);
  const cached = cache && await cache.match(cacheKey);
  if (cached) return cached;
  try {
    const url = new URL('https://api.cloudinary.com/v1_1/' + encodeURIComponent(env.CLOUD_NAME) + '/resources/image/moderations/manual/approved');
    url.searchParams.set('context', 'true');
    url.searchParams.set('max_results', '100');
    const result = await fetch(url.href, { headers: { Authorization: 'Basic ' + btoa(env.CLOUD_API_KEY + ':' + env.CLOUD_API_SECRET) } });
    if (!result.ok) throw Error('cloudinary');
    const data = await result.json();
    if (!Array.isArray(data.resources)) throw Error('format');
    const approved = data.resources.flatMap(asset => {
      const c = asset.context?.custom || {};
      if (asset.moderation_status !== 'approved' || asset.moderation_kind !== 'manual' || asset.resource_type !== 'image' || asset.type !== 'upload') return [];
      const title = clean(c.title, 60), vehicle = clean(c.vehicle, 90), mods = clean(c.mods, 400), category = clean(c.category, 20);
      if (!title || !vehicle || !mods || !CATEGORIES.has(category)) return [];
      let image;
      try { image = new URL(asset.secure_url); } catch { return []; }
      if (image.protocol !== 'https:' || image.hostname !== 'res.cloudinary.com' || !image.pathname.startsWith('/' + env.CLOUD_NAME + '/image/upload/')) return [];
      return [{ title, vehicle, mods, category, imageUrl: image.href, publicId: asset.public_id, slug: 'member-' + String(asset.asset_id || '').replace(/[^a-z0-9]/gi, '').slice(0, 40).toLowerCase(), album: /^[a-f0-9-]{36}$/.test(c.album || '') ? c.album : '', role: c.album_role || '', order: Number(c.album_order) || 0 }];
    });
    const rows = approved.filter(row => row.role !== 'detail').map(row => {
      const photos = row.album ? approved.filter(other => other.album === row.album && other.role === 'detail' && other.title === row.title && other.vehicle === row.vehicle && other.category === row.category && other.mods === row.mods).sort((a, b) => a.order - b.order).slice(0, MAX_PHOTOS - 1).map(other => other.imageUrl) : [];
      const { album, role, order, ...publicRow } = row;
      return { ...publicRow, photos };
    });
    const response = new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Cache-Control': 'public, max-age=900' } });
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  } catch (e) { return reply('Gallery temporarily unavailable', 503, env.ALLOWED_ORIGIN); }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (origin !== env.ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600', 'Vary': 'Origin' } });
    if (request.method === 'GET' && new URL(request.url).pathname === '/capabilities') return new Response(JSON.stringify({ maxPhotos: MAX_PHOTOS, maxImageBytes: MAX_IMAGE }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Cache-Control': 'no-store' } });
    if (request.method === 'GET' && new URL(request.url).pathname === '/approved') return approvedFeed(request, env);
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/upload') return reply('Not found', 404, origin);
    if (!env.CLOUD_NAME || !env.CLOUD_API_KEY || !env.CLOUD_API_SECRET || !env.CLOUD_SIGNED_PRESET || !env.TURNSTILE_SECRET || !env.UPLOAD_RATE || !env.GLOBAL_RATE) return reply('Uploads unavailable', 503, origin);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await env.UPLOAD_RATE.limit({ key: ip })).success || !(await env.GLOBAL_RATE.limit({ key: 'all' })).success) return reply('Try again later', 429, origin);
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.startsWith('multipart/form-data;') || Number(request.headers.get('Content-Length') || 0) > MAX_REQUEST) return reply('Invalid upload', 413, origin);
    let form;
    try { const body = await limitedBody(request); form = await new Request('https://internal/', { method: 'POST', headers: { 'Content-Type': ct }, body }).formData(); }
    catch (e) { return reply('Invalid or oversized upload', 413, origin); }
    const files = form.getAll('file'), token = String(form.get('turnstile') || '');
    const title = clean(form.get('title'), 60), vehicle = clean(form.get('vehicle'), 90), category = clean(form.get('category'), 20), mods = clean(form.get('mods'), 400);
    if (!files.length || files.length > MAX_PHOTOS || files.some(file => !(file instanceof File) || file.size < 100 || file.size > MAX_IMAGE) || !title || !vehicle || !mods || !CATEGORIES.has(category) || !token) return reply('Invalid submission', 400, origin);
    const photos = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer()), type = imageType(bytes);
      if (!type || file.type !== type) return reply('Invalid photo format', 400, origin);
      photos.push({ bytes, type });
    }
    // Reserve global capacity for every image before any external upload.
    for (let i = 1; i < photos.length; i++) if (!(await env.GLOBAL_RATE.limit({ key: 'all' })).success) return reply('Try again later', 429, origin);
    let verification;
    try {
      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }) });
      verification = await result.json();
    } catch (e) { return reply('Human check unavailable', 503, origin); }
    if (!verification.success || !['buildmybeast.com', 'www.buildmybeast.com'].includes(verification.hostname)) return reply('Human check failed', 403, origin);
    const album = photos.length > 1 ? crypto.randomUUID() : '';
    // Upload the cover last. A failed partial album cannot create a public build card.
    const order = [...photos.keys()].slice(1).concat(0);
    for (const index of order) {
      const { bytes, type } = photos[index];
      const context = `title=${title}|vehicle=${vehicle}|category=${category}|mods=${mods}` + (album ? `|album=${album}|album_role=${index === 0 ? 'cover' : 'detail'}|album_order=${index}` : '');
      const timestamp = String(Math.floor(Date.now() / 1000));
      const params = `context=${context}&moderation=manual&timestamp=${timestamp}&upload_preset=${env.CLOUD_SIGNED_PRESET}`;
      const signature = await sha1(params + env.CLOUD_API_SECRET);
      const upload = new FormData();
      upload.set('file', new File([bytes], 'build.' + type.split('/')[1], { type }));
      upload.set('api_key', env.CLOUD_API_KEY);
      upload.set('timestamp', timestamp);
      upload.set('upload_preset', env.CLOUD_SIGNED_PRESET);
      upload.set('context', context);
      upload.set('moderation', 'manual');
      upload.set('signature', signature);
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUD_NAME)}/image/upload`, { method: 'POST', body: upload });
        if (!response.ok) return reply('Image service unavailable; the submission was not completed', 502, origin);
        const asset = await response.json();
        if (!asset.public_id) return reply('Image service unavailable; the submission was not completed', 502, origin);
      } catch (e) { return reply('Image service unavailable; the submission was not completed', 502, origin); }
    }
    return reply('Submitted for review', 202, origin);
  }
};

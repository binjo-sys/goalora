const PBKDF2_ITERATIONS = 120000;
const SESSION_DAYS = 30;

const enc = new TextEncoder();
const dec = new TextDecoder();

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.FRONTEND_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
}

function json(env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(env) }
  });
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(bytes = 24) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return [...raw].map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return base64url(new Uint8Array(bits));
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(token));
  return base64url(new Uint8Array(digest));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

async function createSession(env, userId) {
  const token = randomId(32);
  const tokenHash = await hashToken(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(tokenHash, userId, expiresAt, createdAt).run();
  return { token, expiresAt };
}

async function authenticate(request, env) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const tokenHash = await hashToken(match[1].trim());
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  ).bind(tokenHash, nowIso()).first();
  return row || null;
}

async function requireDb(env) {
  if (!env.DB) throw new Error('D1 database binding DB is not configured');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/health') {
        return json(env, {
          ok: true,
          service: 'goalora-api',
          version: '2.0.0',
          database: Boolean(env.DB),
          auth: Boolean(env.DB)
        });
      }

      if (!env.DB) {
        return json(env, {
          ok: false,
          code: 'DATABASE_NOT_CONFIGURED',
          message: 'Goalora cloud storage is not connected yet.'
        }, 503);
      }

      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const body = await parseJson(request);
        const email = normalizeEmail(body?.email);
        const password = body?.password;
        const displayName = String(body?.displayName || '').trim().slice(0, 80);

        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return json(env, { ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' }, 400);
        }
        if (!validPassword(password)) {
          return json(env, { ok: false, code: 'INVALID_PASSWORD', message: 'Password must be 8–128 characters.' }, 400);
        }
        if (!displayName) {
          return json(env, { ok: false, code: 'INVALID_NAME', message: 'Display name is required.' }, 400);
        }

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
          return json(env, { ok: false, code: 'EMAIL_EXISTS', message: 'An account already exists for this email.' }, 409);
        }

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const passwordHash = await hashPassword(password, salt);
        const userId = randomId(16);
        const createdAt = nowIso();
        await env.DB.prepare(
          `INSERT INTO users (id, email, password_hash, password_salt, display_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(userId, email, passwordHash, base64url(salt), displayName, createdAt).run();

        const session = await createSession(env, userId);
        return json(env, {
          ok: true,
          user: { id: userId, email, displayName },
          token: session.token,
          expiresAt: session.expiresAt
        }, 201);
      }

      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await parseJson(request);
        const email = normalizeEmail(body?.email);
        const password = body?.password;
        const user = await env.DB.prepare(
          'SELECT id, email, password_hash, password_salt, display_name FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user || !validPassword(password)) {
          return json(env, { ok: false, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }, 401);
        }

        const salt = fromBase64url(user.password_salt);
        const candidate = await hashPassword(password, salt);
        if (!timingSafeEqual(candidate, user.password_hash)) {
          return json(env, { ok: false, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }, 401);
        }

        const session = await createSession(env, user.id);
        return json(env, {
          ok: true,
          user: { id: user.id, email: user.email, displayName: user.display_name },
          token: session.token,
          expiresAt: session.expiresAt
        });
      }

      const user = await authenticate(request, env);

      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        if (!user) return json(env, { ok: false, code: 'UNAUTHORIZED' }, 401);
        return json(env, {
          ok: true,
          user: { id: user.id, email: user.email, displayName: user.display_name }
        });
      }

      if (url.pathname === '/api/sync' && request.method === 'GET') {
        if (!user) return json(env, { ok: false, code: 'UNAUTHORIZED' }, 401);
        const row = await env.DB.prepare(
          'SELECT data_json, updated_at FROM user_data WHERE user_id = ?'
        ).bind(user.id).first();
        return json(env, {
          ok: true,
          data: row ? JSON.parse(row.data_json) : null,
          updatedAt: row?.updated_at || null
        });
      }

      if (url.pathname === '/api/sync' && request.method === 'POST') {
        if (!user) return json(env, { ok: false, code: 'UNAUTHORIZED' }, 401);
        const body = await parseJson(request);
        if (!body || typeof body.data !== 'object' || body.data === null) {
          return json(env, { ok: false, code: 'INVALID_DATA', message: 'A data object is required.' }, 400);
        }
        const dataJson = JSON.stringify(body.data);
        if (dataJson.length > 1_500_000) {
          return json(env, { ok: false, code: 'DATA_TOO_LARGE', message: 'Goalora data exceeds the allowed sync size.' }, 413);
        }
        const updatedAt = nowIso();
        await env.DB.prepare(
          `INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`
        ).bind(user.id, dataJson, updatedAt).run();
        return json(env, { ok: true, updatedAt });
      }

      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        const header = request.headers.get('Authorization') || '';
        const match = header.match(/^Bearer\s+(.+)$/i);
        if (match) {
          const tokenHash = await hashToken(match[1].trim());
          await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
        }
        return json(env, { ok: true });
      }

      return json(env, { ok: false, code: 'NOT_FOUND', message: 'Goalora API route not found.' }, 404);
    } catch (error) {
      console.error(error);
      return json(env, { ok: false, code: 'SERVER_ERROR', message: 'Goalora cloud service is temporarily unavailable.' }, 500);
    }
  }
};

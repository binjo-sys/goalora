export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...cors }
    });

    // Health endpoint used by the Goalora client to verify the API is reachable.
    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'goalora-api', version: '1.0.0' });
    }

    // Authentication and persistence endpoints are intentionally kept small for now.
    // The browser app remains local-first until a real identity provider is connected.
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      return json({
        ok: false,
        code: 'AUTH_REQUIRED',
        message: 'Sign-in must be configured before cloud sync is enabled.'
      }, 401);
    }

    return json({ ok: false, code: 'NOT_FOUND', message: 'Goalora API route not found.' }, 404);
  }
};

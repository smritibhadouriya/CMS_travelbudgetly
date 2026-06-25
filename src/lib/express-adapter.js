// src/lib/express-adapter.js
//
// Express-compatibility adapter so the existing Express controllers and
// middleware can run UNCHANGED inside Next.js Route Handlers.
//
// It turns a Web `Request` (NextRequest) into an Express-like `req`, gives the
// controllers a `res` shim (status/json/send/setHeader/cookie), and runs the
// handler chain with `next()` exactly like Express does. The promise resolves
// to a Web `Response` the moment a handler calls res.json()/send()/end().

function serializeCookie(name, value, opts = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (opts.maxAge != null) str += `; Max-Age=${Math.floor(opts.maxAge / 1000)}`;
  if (opts.expires) str += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.path) str += `; Path=${opts.path}`; else str += `; Path=/`;
  if (opts.domain) str += `; Domain=${opts.domain}`;
  if (opts.httpOnly) str += `; HttpOnly`;
  if (opts.secure) str += `; Secure`;
  if (opts.sameSite) str += `; SameSite=${opts.sameSite}`;
  return str;
}

function isFileLike(v) {
  return v && typeof v === 'object' && typeof v.arrayBuffer === 'function' && 'name' in v;
}

async function buildReq(request, ctx) {
  // Query (last value wins, repeated keys collapse to arrays — like Express)
  const query = {};
  const sp = request.nextUrl?.searchParams ?? new URL(request.url).searchParams;
  for (const [k, v] of sp.entries()) {
    if (query[k] === undefined) query[k] = v;
    else if (Array.isArray(query[k])) query[k].push(v);
    else query[k] = [query[k], v];
  }

  // Route params (Next 15+ params is a Promise)
  let params = {};
  if (ctx?.params) params = (await ctx.params) || {};

  // Cookies
  const cookies = {};
  if (request.cookies?.getAll) {
    for (const c of request.cookies.getAll()) cookies[c.name] = c.value;
  }

  // Headers
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });

  const req = {
    method: request.method,
    url: request.url,
    originalUrl: request.url,
    query,
    params,
    cookies,
    headers,
    body: {},
    _files: [],
    file: undefined,
    files: undefined,
    user: undefined,
    get(name) { return request.headers.get(name); },
  };

  // Body parsing by content-type
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (ct.includes('application/json')) {
      try { req.body = await request.json(); } catch { req.body = {}; }
    } else if (ct.includes('multipart/form-data')) {
      const form = await request.formData();
      const body = {};
      const files = [];
      for (const [key, value] of form.entries()) {
        if (isFileLike(value)) {
          const buffer = Buffer.from(await value.arrayBuffer());
          files.push({
            fieldname: key,
            originalname: value.name,
            mimetype: value.type,
            size: buffer.length,
            buffer,
          });
        } else {
          body[key] = value;
        }
      }
      req.body = body;
      req._files = files;
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      try {
        const form = await request.formData();
        const body = {};
        for (const [k, v] of form.entries()) body[k] = v;
        req.body = body;
      } catch { req.body = {}; }
    } else {
      // Unknown / empty body
      try {
        const text = await request.text();
        req.body = text ? { _raw: text } : {};
      } catch { req.body = {}; }
    }
  }

  return req;
}

function buildRes(resolve) {
  const headers = new Headers();
  const res = {
    statusCode: 200,
    headersSent: false,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { headers.set(name, value); return this; },
    header(name, value) { return this.set(name, value); },
    set(name, value) {
      if (name && typeof name === 'object') {
        for (const k of Object.keys(name)) headers.set(k, name[k]);
      } else {
        headers.set(name, value);
      }
      return this;
    },
    type(t) { headers.set('content-type', t); return this; },
    cookie(name, value, opts = {}) {
      headers.append('set-cookie', serializeCookie(name, value, opts));
      return this;
    },
    clearCookie(name, opts = {}) {
      headers.append('set-cookie', serializeCookie(name, '', { ...opts, maxAge: 0 }));
      return this;
    },
    json(obj) {
      if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8');
      this.headersSent = true;
      resolve(new Response(JSON.stringify(obj), { status: this.statusCode, headers }));
      return this;
    },
    send(data) {
      this.headersSent = true;
      if (data === undefined || data === null) {
        resolve(new Response(null, { status: this.statusCode, headers }));
      } else if (typeof data === 'object' && !Buffer.isBuffer(data) && !(data instanceof Uint8Array)) {
        return this.json(data);
      } else {
        resolve(new Response(data, { status: this.statusCode, headers }));
      }
      return this;
    },
    end(data) {
      this.headersSent = true;
      resolve(new Response(data ?? null, { status: this.statusCode, headers }));
      return this;
    },
    redirect(arg1, arg2) {
      const status = typeof arg1 === 'number' ? arg1 : 302;
      const location = typeof arg1 === 'number' ? arg2 : arg1;
      headers.set('location', location);
      this.headersSent = true;
      resolve(new Response(null, { status, headers }));
      return this;
    },
    sendStatus(code) { this.statusCode = code; return this.send(String(code)); },
  };
  return res;
}

/**
 * Run an Express-style middleware/controller chain inside a Route Handler.
 * @param {Request} request  Web/NextRequest
 * @param {{params?: Promise<object>}} ctx  Route context
 * @param  {...Function} handlers  (req, res, next) handlers
 * @returns {Promise<Response>}
 */
export async function runRoute(request, ctx, ...handlers) {
  let req;
  try {
    req = await buildReq(request, ctx);
  } catch (e) {
    return Response.json({ success: false, message: 'Bad request', error: String(e?.message || e) }, { status: 400 });
  }

  return await new Promise((resolve) => {
    let settled = false;
    const safeResolve = (r) => { if (!settled) { settled = true; resolve(r); } };
    const res = buildRes(safeResolve);

    let idx = 0;
    const next = async (err) => {
      if (err) {
        console.error('Route middleware error:', err);
        return safeResolve(Response.json({ success: false, message: err.message || 'Server error' }, { status: 500 }));
      }
      const handler = handlers[idx++];
      if (!handler) {
        if (!settled) safeResolve(new Response(null, { status: 404 }));
        return;
      }
      try {
        await handler(req, res, next);
      } catch (e) {
        console.error('Route handler threw:', e);
        if (!settled) safeResolve(Response.json({ success: false, message: e.message || 'Server error' }, { status: 500 }));
      }
    };

    next();
  });
}

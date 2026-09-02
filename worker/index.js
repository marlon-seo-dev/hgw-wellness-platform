/* ============================================================================
   HGW WELLNESS / FOR LIFE — CLOUDFLARE WORKER (API)
   ============================================================================
   Este Worker es el ÚNICO punto que habla con D1. El frontend (Cloudflare
   Pages) nunca consulta la base de datos directamente ni decide por sí
   mismo si un usuario está autenticado: eso lo valida este archivo en cada
   solicitud, contra la tabla `sessions` en D1 — no contra localStorage.

   Estado de esta entrega: arquitectura preparada y funcional, pero el
   frontend actual (index.html/script.js) TODAVÍA NO llama a estos
   endpoints — sigue funcionando 100% con localStorage, tal como se pidió
   explícitamente ("no migrar todo de golpe"). Este Worker queda listo para
   conectarse módulo por módulo en la siguiente fase.

   Organización de este archivo:
     1. CORS
     2. Utilidades de respuesta JSON
     3. Criptografía (hash de contraseñas, tokens) — Web Crypto API
     4. Sesiones (cookie HttpOnly)
     5. Utilidades de recursos multi-tenant (scoped por user_id)
     6. Handlers de autenticación (/api/auth/*)
     7. Handlers de recursos privados (clientes, productos, seguimientos,
        planes semanales, planes deportivos)
     8. Handlers de recursos públicos + privados (solicitudes, reservas SPA)
     9. Router principal (fetch)
   ============================================================================ */

/* --------------------------------------------------------------------------
   1. CORS
   Necesario mientras el Worker viva en un dominio distinto al de Pages
   durante el desarrollo local (wrangler dev en un puerto, Pages en otro).
   En producción, lo recomendado es enrutar el Worker en el MISMO dominio
   que Pages bajo /api/* (ver informe, punto 11) — en ese caso el navegador
   trata todo como same-origin y estos encabezados dejan de ser críticos,
   pero no estorban.
   -------------------------------------------------------------------------- */
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const permitido = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const origenValido = permitido.length === 0 || permitido.includes(origin);
  return {
    'Access-Control-Allow-Origin': origenValido ? origin : (permitido[0] || ''),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* --------------------------------------------------------------------------
   2. UTILIDADES DE RESPUESTA JSON
   -------------------------------------------------------------------------- */
function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

/* --------------------------------------------------------------------------
   3. CRIPTOGRAFÍA — Web Crypto API (disponible de forma nativa en Workers)
   Contraseñas: PBKDF2 + SHA-256 + salt aleatorio por usuario. Nunca se
   guarda ni se transmite la contraseña en texto plano más allá de la
   solicitud HTTPS original de login.
   -------------------------------------------------------------------------- */
const PBKDF2_ITERATIONS = 100000;

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes.buffer;
}
function randomHex(byteLength) {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(byteLength)).buffer);
}

async function hashPassword(password, saltHex, env) {
  const pimienta = (env && env.PEPPER) || ''; // ver wrangler secret put PEPPER
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password + pimienta), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBuffer(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return bufferToHex(bits);
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyPassword(password, saltHex, expectedHashHex, env) {
  const computed = await hashPassword(password, saltHex, env);
  return timingSafeEqualHex(computed, expectedHashHex);
}

// Generador de códigos únicos (solicitudes de asesoría, reservas SPA).
// Usa crypto.getRandomValues (aleatoriedad criptográfica real), a
// diferencia del Math.random() usado hoy en el frontend.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generarCodigo(prefijo) {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let sufijo = '';
  for (let i = 0; i < 5; i++) sufijo += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return `${prefijo}-${sufijo}`;
}

/* --------------------------------------------------------------------------
   4. SESIONES
   Cookie HttpOnly + Secure + SameSite=Lax. El token NUNCA es accesible
   desde JavaScript del frontend (por diseño: HttpOnly), a diferencia de
   hgw_session en localStorage, que cualquier script podía leer o falsear.
   -------------------------------------------------------------------------- */
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12 horas

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function cookieFlags(env) {
  // 'Secure' requiere HTTPS. En desarrollo local (wrangler dev por HTTP)
  // se omite mediante env.ENVIRONMENT = 'development' (ver wrangler.toml).
  return env.ENVIRONMENT === 'development' ? '' : ' Secure;';
}

function sessionCookieHeader(token, expiresAt, env) {
  return `hgw_session_token=${token}; HttpOnly;${cookieFlags(env)} SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}`;
}

function clearCookieHeader(env) {
  return `hgw_session_token=; HttpOnly;${cookieFlags(env)} SameSite=Lax; Path=/; Max-Age=0`;
}

async function createSession(env, userId, request) {
  const token = randomHex(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)`
  ).bind(token, userId, now.toISOString(), expiresAt.toISOString(), request.headers.get('User-Agent') || '').run();
  return { token, expiresAt };
}

// Filtro de seguridad real (Fase 2): se ejecuta en CADA solicitud a un
// endpoint protegido. Si no hay sesión válida en D1, se bloquea aquí —
// el frontend no participa en esta decisión.
async function getSessionUser(request, env) {
  const token = getCookie(request, 'hgw_session_token');
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, u.id AS user_id, u.username, u.brand_name, u.active
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  ).bind(token).first();

  if (!row || !row.active) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(token).run();
    return null;
  }
  return { id: row.user_id, username: row.username, brandName: row.brand_name, sessionId: row.session_id };
}

async function destroySession(request, env) {
  const token = getCookie(request, 'hgw_session_token');
  if (token) await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(token).run();
}

/* --------------------------------------------------------------------------
   5. UTILIDADES DE RECURSOS MULTI-TENANT
   Todo recurso privado se filtra SIEMPRE por user_id en la propia consulta
   SQL — no solo se revisa "está logueado", sino "es dueño de este dato"
   (segundo nivel del filtro pedido en la Fase 2: "¿el usuario tiene
   permiso?"). Esto hace estructuralmente imposible que un usuario futuro
   consulte o modifique información de otro.
   -------------------------------------------------------------------------- */
function nowISO() { return new Date().toISOString(); }
function uuid() { return crypto.randomUUID(); }

const RECURSOS = {
  clients: {
    table: 'clients',
    columns: ['nombre', 'telefono', 'correo', 'edad', 'fecha_registro', 'peso', 'talla',
      'objetivo', 'actividad', 'agua', 'sexo', 'experiencia', 'preferencias', 'restricciones',
      'evitar', 'habitos', 'observaciones', 'proximo_seguimiento', 'historial_peso_json', 'demo'],
  },
  products: {
    table: 'products',
    columns: ['nombre', 'categoria', 'descripcion', 'imagen', 'ingredientes', 'modo_de_uso',
      'advertencias', 'objetivos_compatibles_json', 'activo', 'demo'],
  },
  'follow-ups': {
    table: 'follow_ups',
    columns: ['client_id', 'fecha', 'peso', 'cumplimiento', 'hidratacion', 'actividad',
      'bienestar', 'productos', 'proximo_seguimiento', 'observaciones', 'demo'],
  },
};

// Listar / crear / actualizar / eliminar — genérico para clients, products,
// follow-ups (misma forma de CRUD; evita duplicar el mismo código 3 veces).
async function listRecurso(env, user, nombreRecurso) {
  const cfg = RECURSOS[nombreRecurso];
  const { results } = await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(user.id).all();
  return results;
}

async function crearRecurso(env, user, nombreRecurso, body) {
  const cfg = RECURSOS[nombreRecurso];
  const id = body.id || uuid();
  const columnas = ['id', 'user_id', ...cfg.columns, 'created_at'];
  const valores = [id, user.id, ...cfg.columns.map(c => body[c] ?? null), nowISO()];
  if (cfg.table !== 'follow_ups') { columnas.push('updated_at'); valores.push(nowISO()); }
  const placeholders = columnas.map(() => '?').join(', ');
  await env.DB.prepare(`INSERT INTO ${cfg.table} (${columnas.join(', ')}) VALUES (${placeholders})`)
    .bind(...valores).run();
  return { id };
}

async function actualizarRecurso(env, user, nombreRecurso, id, body) {
  const cfg = RECURSOS[nombreRecurso];
  const existente = await env.DB.prepare(`SELECT id FROM ${cfg.table} WHERE id = ? AND user_id = ?`)
    .bind(id, user.id).first();
  if (!existente) return false; // no existe O no es del usuario -> mismo resultado hacia afuera
  const sets = cfg.columns.map(c => `${c} = ?`);
  const valores = cfg.columns.map(c => body[c] ?? null);
  if (cfg.table !== 'follow_ups') { sets.push('updated_at = ?'); valores.push(nowISO()); }
  valores.push(id, user.id);
  await env.DB.prepare(`UPDATE ${cfg.table} SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...valores).run();
  return true;
}

async function eliminarRecurso(env, user, nombreRecurso, id) {
  const cfg = RECURSOS[nombreRecurso];
  const res = await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id = ? AND user_id = ?`)
    .bind(id, user.id).run();
  return res.meta.changes > 0;
}

/* --------------------------------------------------------------------------
   6. AUTENTICACIÓN — /api/auth/*
   -------------------------------------------------------------------------- */
async function handleLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Cuerpo inválido.' }, 400); }

  const usuario = (body.usuario || '').trim();
  const password = body.password || '';
  if (!usuario || !password) return json({ error: 'Usuario y contraseña son obligatorios.' }, 400);

  const fila = await env.DB.prepare(`SELECT * FROM users WHERE username = ? AND active = 1`)
    .bind(usuario).first();

  // Mensaje genérico intencional: no revelar si falló por usuario o por
  // contraseña (evita que alguien pueda enumerar usuarios válidos).
  if (!fila) return json({ error: 'Usuario o contraseña incorrectos.' }, 401);

  const valido = await verifyPassword(password, fila.password_salt, fila.password_hash, env);
  if (!valido) return json({ error: 'Usuario o contraseña incorrectos.' }, 401);

  const { token, expiresAt } = await createSession(env, fila.id, request);
  return json(
    { usuario: fila.username, marca: fila.brand_name },
    200,
    { 'Set-Cookie': sessionCookieHeader(token, expiresAt, env) }
  );
}

async function handleLogout(request, env) {
  await destroySession(request, env);
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookieHeader(env) });
}

async function handleSessionCheck(request, env) {
  const user = await getSessionUser(request, env);
  if (!user) return json({ autenticado: false }, 200);
  return json({ autenticado: true, usuario: user.username, marca: user.brandName }, 200);
}

/* --------------------------------------------------------------------------
   7. RECURSOS PRIVADOS — clientes, productos, seguimientos
   (planes semanales y deportivos van en la sección 8 por su semántica
   de "uno vigente por cliente" en vez de lista libre)
   -------------------------------------------------------------------------- */
async function handleRecursoPrivado(request, env, user, nombreRecurso, id) {
  if (request.method === 'GET' && !id) return json(await listRecurso(env, user, nombreRecurso), 200);

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));

    if (nombreRecurso === 'follow-ups') {
      const cliente = await env.DB.prepare(
        `SELECT id FROM clients WHERE id = ? AND user_id = ?`
      ).bind(body.client_id, user.id).first();

      if (!cliente) {
        return json({ error: 'Cliente no encontrado.' }, 404);
      }
    }

    const creado = await crearRecurso(env, user, nombreRecurso, body);
    return json(creado, 201);
  }

  if (request.method === 'PUT' && id) {
    const body = await request.json().catch(() => ({}));
    const ok = await actualizarRecurso(env, user, nombreRecurso, id, body);
    if (!ok) return json({ error: 'No encontrado.' }, 404);
    return json({ ok: true }, 200);
  }

  if (request.method === 'DELETE' && id) {
    const ok = await eliminarRecurso(env, user, nombreRecurso, id);
    if (!ok) return json({ error: 'No encontrado.' }, 404);
    return json({ ok: true }, 200);
  }

  return json({ error: 'Método no soportado.' }, 405);
}

/* --------------------------------------------------------------------------
   8a. PLANES (semanales y deportivos) — un plan vigente por cliente
   Usa el mismo patrón "reemplazar si ya existe" que ya tiene el frontend
   con guardarPlanSemanalCompleto()/guardarPlanDeportivo(), aprovechando
   la restricción UNIQUE(client_id) del schema (ON CONFLICT DO UPDATE).
   -------------------------------------------------------------------------- */
async function handlePlan(request, env, user, tabla, camposJson, id) {
  if (request.method === 'GET' && !id) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${tabla} WHERE user_id = ?`).bind(user.id).all();
    return json(results, 200);
  }

  if (request.method === 'GET' && id) {
    // aquí "id" se interpreta como client_id: /api/weekly-plans/by-client/<id>
    const fila = await env.DB.prepare(`SELECT * FROM ${tabla} WHERE client_id = ? AND user_id = ?`)
      .bind(id, user.id).first();
    return fila ? json(fila, 200) : json(null, 200);
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (!body.client_id) return json({ error: 'client_id es obligatorio.' }, 400);
    const clienteDelUsuario = await env.DB.prepare(`SELECT id FROM clients WHERE id = ? AND user_id = ?`)
      .bind(body.client_id, user.id).first();
    if (!clienteDelUsuario) return json({ error: 'Cliente no encontrado.' }, 404);

    const id2 = uuid();
    const columnas = ['id', 'user_id', 'client_id', ...camposJson, 'created_at', 'updated_at'];
    const valores = [id2, user.id, body.client_id, ...camposJson.map(c => body[c] ?? null), nowISO(), nowISO()];
    const setUpdate = camposJson.map(c => `${c} = excluded.${c}`).concat('updated_at = excluded.updated_at').join(', ');
    await env.DB.prepare(
      `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})
       ON CONFLICT(client_id) DO UPDATE SET ${setUpdate}`
    ).bind(...valores).run();
    return json({ ok: true }, 201);
  }

  return json({ error: 'Método no soportado.' }, 405);
}

/* --------------------------------------------------------------------------
   8b. SOLICITUDES DE ASESORÍA Y RESERVAS SPA
   POST es PÚBLICO (sin sesión) porque lo llena un visitante desde el
   acceso público. GET/PATCH son privados (panel del emprendedor).

   resolveTenantUserId(): mientras la plataforma sea de un solo
   emprendedor, toda solicitud pública se asigna a ese único usuario. En
   la versión multiusuario esto se resolverá por subdominio o slug de
   negocio en la URL en vez de "tomar el primero que exista".
   -------------------------------------------------------------------------- */
async function resolveTenantUserId(env) {
  const fila = await env.DB.prepare(`SELECT id FROM users WHERE active = 1 ORDER BY created_at ASC LIMIT 1`).first();
  return fila ? fila.id : null;
}

async function handlePublicoYPrivado(request, env, tabla, prefijoCodigo, camposPublicos, id) {
  if (request.method === 'POST') {
    const userId = await resolveTenantUserId(env);
    if (!userId) return json({ error: 'Negocio no configurado todavía.' }, 503);

    const body = await request.json().catch(() => ({}));
    const id2 = uuid();
    const codigo = generarCodigo(prefijoCodigo);
    const columnas = ['id', 'user_id', 'codigo', ...camposPublicos, 'fecha', 'estado', 'created_at'];
    const valores = [id2, userId, codigo, ...camposPublicos.map(c => body[c] ?? null), nowISO().slice(0, 10), 'pendiente', nowISO()];
    await env.DB.prepare(`INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`)
      .bind(...valores).run();
    return json({ id: id2, codigo }, 201);
  }

  // A partir de aquí, todo requiere sesión — se valida en el router antes
  // de llegar acá para GET/PATCH de este mismo recurso.
  if (request.method === 'GET') {
    const user = request.__user;
    const { results } = await env.DB.prepare(`SELECT * FROM ${tabla} WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(user.id).all();
    return json(results, 200);
  }

  if (request.method === 'PATCH' && id) {
    const user = request.__user;
    const body = await request.json().catch(() => ({}));
    if (!body.estado) return json({ error: 'estado es obligatorio.' }, 400);
    const res = await env.DB.prepare(`UPDATE ${tabla} SET estado = ? WHERE id = ? AND user_id = ?`)
      .bind(body.estado, id, user.id).run();
    if (res.meta.changes === 0) return json({ error: 'No encontrado.' }, 404);
    return json({ ok: true }, 200);
  }

  return json({ error: 'Método no soportado.' }, 405);
}

/* --------------------------------------------------------------------------
   9. ROUTER PRINCIPAL
   -------------------------------------------------------------------------- */
export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const partes = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
    const [recurso, idParam, sub] = partes;

    let respuesta;
    try {
      // --- Autenticación (públicos) ---
      if (recurso === 'auth' && idParam === 'login' && request.method === 'POST') {
        respuesta = await handleLogin(request, env);
      } else if (recurso === 'auth' && idParam === 'logout' && request.method === 'POST') {
        respuesta = await handleLogout(request, env);
      } else if (recurso === 'auth' && idParam === 'session' && request.method === 'GET') {
        respuesta = await handleSessionCheck(request, env);

      // --- Recursos privados genéricos (clientes, productos, seguimientos) ---
      } else if (['clients', 'products', 'follow-ups'].includes(recurso)) {
        const user = await getSessionUser(request, env);
        if (!user) { respuesta = json({ error: 'No autenticado.' }, 401); }
        else { respuesta = await handleRecursoPrivado(request, env, user, recurso, idParam); }

      // --- Planes semanales / deportivos (siempre privados) ---
      } else if (recurso === 'weekly-plans' || recurso === 'sports-plans') {
        const user = await getSessionUser(request, env);
        if (!user) { respuesta = json({ error: 'No autenticado.' }, 401); }
        else {
          const tabla = recurso === 'weekly-plans' ? 'weekly_plans' : 'sports_plans';
          const campos = recurso === 'weekly-plans' ? ['objetivo', 'fecha', 'dias_json'] : ['fecha', 'datos_json', 'justificacion_json'];
          respuesta = await handlePlan(request, env, user, tabla, campos, idParam);
        }

      // --- Solicitudes de asesoría (público POST, privado GET/PATCH) ---
      } else if (recurso === 'consultation-requests') {
        if (request.method !== 'POST') {
          const user = await getSessionUser(request, env);
          if (!user) { respuesta = json({ error: 'No autenticado.' }, 401); }
          else { request.__user = user; }
        }
        if (!respuesta) {
          respuesta = await handlePublicoYPrivado(
            request, env, 'consultation_requests', 'HGW',
            ['nombre', 'telefono', 'correo', 'negocio', 'ciudad', 'motivo', 'preferencia'],
            idParam
          );
        }

      // --- Reservas SPA (público POST, privado GET/PATCH) ---
      } else if (recurso === 'spa-reservations') {
        if (request.method !== 'POST') {
          const user = await getSessionUser(request, env);
          if (!user) { respuesta = json({ error: 'No autenticado.' }, 401); }
          else { request.__user = user; }
        }
        if (!respuesta) {
          respuesta = await handlePublicoYPrivado(
            request, env, 'spa_reservations', 'SPA-KR',
            ['tipo_id', 'tipo_nombre', 'fecha', 'hora', 'nombre', 'telefono', 'correo', 'observaciones'],
            idParam
          );
        }

      } else {
        respuesta = json({ error: 'Ruta no encontrada.' }, 404);
      }
    } catch (err) {
      console.error('Error en el Worker:', err);
      respuesta = json({ error: 'Error interno del servidor.' }, 500);
    }

    // Se agregan los encabezados CORS a toda respuesta, conservando los
    // que ya traiga (por ejemplo, Set-Cookie del login/logout).
    const headers = new Headers(respuesta.headers);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
    return new Response(respuesta.body, { status: respuesta.status, headers });
  },
};
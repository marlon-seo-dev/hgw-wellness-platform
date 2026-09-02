// Arnés de prueba local: NO se despliega. Simula D1 con SQLite real
// (node:sqlite) cargando database/schema.sql tal cual, y ejecuta
// worker/index.js real (el mismo archivo que se sube a Cloudflare) contra
// esa base, disparando solicitudes fetch() reales.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import worker from '../index.js';

const schema = fs.readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8');
const db = new DatabaseSync(':memory:');
db.exec(schema);

// ---- Shim D1: implementa exactamente la superficie que usa worker/index.js ----
function toD1Row(row) { return row; }
const DB = {
  prepare(sql) {
    return {
      _sql: sql,
      _params: [],
      bind(...params) { this._params = params; return this; },
      async run() {
        const stmt = db.prepare(this._sql);
        const info = stmt.run(...this._params);
        return { meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
      },
      async all() {
        const stmt = db.prepare(this._sql);
        return { results: stmt.all(...this._params).map(toD1Row) };
      },
      async first() {
        const stmt = db.prepare(this._sql);
        const row = stmt.get(...this._params);
        return row ? toD1Row(row) : null;
      },
    };
  },
};

const env = { DB, ENVIRONMENT: 'development', ALLOWED_ORIGIN: 'http://localhost:8788', PEPPER: 'pepper-de-prueba-local' };

const resultados = [];
const log = (etiqueta, ok, detalle) => resultados.push({ etiqueta, ok, detalle: detalle || '' });

// ---- Crear el usuario inicial exactamente como lo haría el comando wrangler d1 execute del informe ----
const USUARIO = 'HGW Rafer';
const PASSWORD = 'ForLife@HGW2026';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(PASSWORD + env.PEPPER, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex');
db.prepare(`INSERT INTO users (id, username, brand_name, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)`)
  .run('user_1', USUARIO, 'For Life', hash, salt);

function extractCookie(response) {
  const raw = response.headers.get('Set-Cookie') || '';
  const match = raw.match(/hgw_session_token=([^;]*)/);
  return match ? match[1] : null;
}

async function call(method, path, { body, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = `hgw_session_token=${cookie}`;
  const request = new Request(`http://localhost/api${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const response = await worker.fetch(request, env, {});
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data, cookie: extractCookie(response) };
}

async function main() {
  // 1) Login con credenciales incorrectas
  let r = await call('POST', '/auth/login', { body: { usuario: USUARIO, password: 'incorrecta' } });
  log('Worker: login con contraseña incorrecta -> 401', r.status === 401, JSON.stringify(r.data));

  r = await call('POST', '/auth/login', { body: { usuario: 'otro', password: PASSWORD } });
  log('Worker: login con usuario incorrecto -> 401', r.status === 401);

  r = await call('POST', '/auth/login', { body: { usuario: '', password: '' } });
  log('Worker: login con campos vacíos -> 400', r.status === 400);

  // 2) Login correcto
  r = await call('POST', '/auth/login', { body: { usuario: USUARIO, password: PASSWORD } });
  log('Worker: login correcto -> 200', r.status === 200, JSON.stringify(r.data));
  log('Worker: login correcto entrega cookie de sesión', !!r.cookie);
  const cookie = r.cookie;

  // 3) Acceso a recurso protegido SIN cookie -> 401
  r = await call('GET', '/clients');
  log('Worker: /api/clients SIN sesión -> 401 (filtro de seguridad)', r.status === 401);

  // 4) Acceso a recurso protegido CON cookie -> 200
  r = await call('GET', '/clients', { cookie });
  log('Worker: /api/clients CON sesión -> 200', r.status === 200);

  // 5) Crear cliente real y confirmar que queda con user_id correcto
  r = await call('POST', '/clients', {
    cookie,
    body: { nombre: 'Cliente Worker', telefono: '3000000000', objetivo: 'bienestar-general', peso: 70, talla: 170, historial_peso_json: '[]', demo: 0 },
  });
  log('Worker: crear cliente -> 201', r.status === 201, JSON.stringify(r.data));
  const clienteId = r.data.id;

  r = await call('GET', '/clients', { cookie });
  log('Worker: el cliente creado aparece en el listado', r.data.some(c => c.id === clienteId));

  // 6) Multi-tenant: un segundo usuario NO debe ver los datos del primero
  const salt2 = crypto.randomBytes(16).toString('hex');
  const hash2 = crypto.pbkdf2Sync('Otra@Clave123' + env.PEPPER, Buffer.from(salt2, 'hex'), 100000, 32, 'sha256').toString('hex');
  db.prepare(`INSERT INTO users (id, username, brand_name, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)`)
    .run('user_2', 'Otro Emprendedor', 'Otra Marca', hash2, salt2);
  r = await call('POST', '/auth/login', { body: { usuario: 'Otro Emprendedor', password: 'Otra@Clave123' } });
  const cookie2 = r.cookie;
  r = await call('GET', '/clients', { cookie: cookie2 });
  log('AISLAMIENTO MULTI-TENANT: el segundo usuario NO ve clientes del primero', r.data.length === 0, `Vio: ${r.data.length} clientes`);

  // 7) Plan semanal: crear y luego "regenerar" (debe reemplazar, no duplicar)
  r = await call('POST', '/weekly-plans', { cookie, body: { client_id: clienteId, objetivo: 'bienestar-general', fecha: '2026-01-01', dias_json: '[{"dia":"Lunes"}]' } });
  log('Worker: crear plan semanal -> 201', r.status === 201);
  r = await call('POST', '/weekly-plans', { cookie, body: { client_id: clienteId, objetivo: 'bienestar-general', fecha: '2026-01-02', dias_json: '[{"dia":"Lunes editado"}]' } });
  log('Worker: regenerar plan semanal -> 201 (upsert)', r.status === 201);
  r = await call('GET', '/weekly-plans', { cookie });
  log('Worker: solo hay 1 plan semanal vigente para ese cliente (no se duplicó)', r.data.filter(p => p.client_id === clienteId).length === 1, `Encontrados: ${r.data.length}`);

  // 8) Solicitud de asesoría PÚBLICA (sin cookie) genera código único
  r = await call('POST', '/consultation-requests', { body: { nombre: 'Visitante Público', telefono: '3001112222', ciudad: 'Bogotá', motivo: 'Quiero información' } });
  log('Worker: solicitud pública sin sesión -> 201', r.status === 201, JSON.stringify(r.data));
  log('Worker: código de solicitud con formato KAIROS-XXXXX', /^KAIROS-[A-Z0-9]{5}$/.test(r.data.codigo || ''), r.data.codigo);

  // 9) Esa solicitud debe verse en el panel privado del emprendedor
  r = await call('GET', '/consultation-requests', { cookie });
  log('Worker: la solicitud pública aparece en el panel privado', r.data.some(s => s.nombre === 'Visitante Público'));

  // 10) Reserva SPA pública + cambio de estado desde el panel privado
  r = await call('POST', '/spa-reservations', { body: { tipo_id: 'masaje-reductor', tipo_nombre: 'Masaje reductor', fecha: '2026-02-01', hora: '10:00', nombre: 'Cliente SPA', telefono: '3003334444' } });
  log('Worker: reserva SPA pública -> 201 con código SPA-KR-XXXXX', r.status === 201 && /^SPA-KR-[A-Z0-9]{5}$/.test(r.data.codigo || ''), JSON.stringify(r.data));
  const reservaId = r.data.id;
  r = await call('PATCH', `/spa-reservations/${reservaId}`, { cookie, body: { estado: 'confirmada' } });
  log('Worker: cambiar estado de reserva SPA -> 200', r.status === 200);
  r = await call('GET', '/spa-reservations', { cookie });
  log('Worker: el nuevo estado quedó guardado', r.data.find(x => x.id === reservaId)?.estado === 'confirmada');

  // 11) Logout invalida la sesión de verdad (no solo en el navegador)
  r = await call('POST', '/auth/logout', { cookie });
  log('Worker: logout -> 200', r.status === 200);
  r = await call('GET', '/clients', { cookie });
  log('Worker: tras logout, la MISMA cookie ya NO sirve (sesión borrada en el servidor)', r.status === 401);

  const total = resultados.length;
  const ok = resultados.filter(x => x.ok).length;
  console.log(JSON.stringify(resultados, null, 2));
  console.log(`\n=== RESUMEN WORKER: ${ok}/${total} verificaciones correctas ===`);
  process.exit(ok === total ? 0 : 1);
}

main();

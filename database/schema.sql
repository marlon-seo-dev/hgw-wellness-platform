-- ============================================================================
-- HGW WELLNESS / FOR LIFE — SCHEMA CLOUDFLARE D1
-- ============================================================================
-- Este schema es ADITIVO al proyecto: no reemplaza localStorage todavía.
-- Es la base de datos hacia la que se migrará progresivamente, módulo por
-- módulo, según la FASE 8 (migración segura) del plan acordado.
--
-- Convenciones:
--   - Todos los IDs son TEXT (UUID generados en el Worker con crypto.randomUUID()),
--     para poder conservar los mismos IDs que ya usa el frontend (uid()).
--   - Fechas se guardan como TEXT en formato ISO 8601 (mismo formato que ya
--     usa el frontend: YYYY-MM-DD o YYYY-MM-DDTHH:MM:SS.sssZ).
--   - Campos que en el frontend son objetos/arrays (historialPeso,
--     objetivosCompatibles, dias, justificacion) se guardan como TEXT con
--     JSON.stringify — D1/SQLite no tiene tipo JSON nativo, pero sí funciones
--     json_extract() si más adelante se necesitan consultas internas.
--   - Toda tabla de datos del emprendedor tiene user_id, con
--     ON DELETE CASCADE, para que sea estructuralmente imposible que un
--     usuario futuro vea o modifique datos de otro (requisito de la Fase 4).
--   - "demo" se conserva como INTEGER (0/1) para poder replicar la misma
--     lógica de "Reiniciar datos demo" que ya existe en el frontend
--     (nunca borrar registros con demo = 0).
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- USERS — un emprendedor por fila (multiusuario preparado, no activado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,      -- Ej: 'HGW Rafer'
  brand_name    TEXT,                      -- Ej: 'For Life'
  password_hash TEXT NOT NULL,             -- hash PBKDF2 (hex), nunca texto plano
  password_salt TEXT NOT NULL,             -- salt aleatorio (hex) único por usuario
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);

-- ----------------------------------------------------------------------------
-- SESSIONS — tokens de sesión emitidos por el Worker tras un login válido
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,            -- token de sesión (aleatorio, ver Worker)
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at  TEXT NOT NULL,               -- expiración explícita (ver Fase 6)
  user_agent  TEXT,
  ip_hint     TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- ----------------------------------------------------------------------------
-- CLIENTS — equivalente a state.clientes / hgw_clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre               TEXT NOT NULL,
  telefono             TEXT,
  correo               TEXT,
  edad                 INTEGER,
  fecha_registro       TEXT,
  peso                 REAL,
  talla                REAL,
  objetivo             TEXT,
  actividad             TEXT,
  agua                 INTEGER,
  sexo                 TEXT,
  experiencia          TEXT,
  preferencias         TEXT,
  restricciones        TEXT,
  evitar               TEXT,
  habitos              TEXT,
  observaciones        TEXT,
  proximo_seguimiento  TEXT,
  historial_peso_json  TEXT NOT NULL DEFAULT '[]',   -- [{fecha, peso}, ...]
  demo                 INTEGER NOT NULL DEFAULT 0 CHECK (demo IN (0,1)),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- ----------------------------------------------------------------------------
-- PRODUCTS — equivalente a state.productos / hgw_productos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                       TEXT PRIMARY KEY,
  user_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre                   TEXT NOT NULL,
  categoria                TEXT,
  descripcion              TEXT,
  imagen                   TEXT,
  ingredientes             TEXT,
  modo_de_uso              TEXT,
  advertencias             TEXT,
  objetivos_compatibles_json TEXT NOT NULL DEFAULT '[]',  -- ["control-peso", ...]
  activo                   INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  demo                     INTEGER NOT NULL DEFAULT 0 CHECK (demo IN (0,1)),
  created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);

-- ----------------------------------------------------------------------------
-- FOLLOW_UPS — equivalente a state.seguimientos / hgw_seguimientos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_ups (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id            TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  fecha                TEXT NOT NULL,
  peso                 REAL,
  cumplimiento         TEXT,
  hidratacion          INTEGER,
  actividad            TEXT,
  bienestar            TEXT,
  productos             TEXT,
  proximo_seguimiento  TEXT,
  observaciones        TEXT,
  demo                 INTEGER NOT NULL DEFAULT 0 CHECK (demo IN (0,1)),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_followups_user   ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_followups_client ON follow_ups(client_id);

-- ----------------------------------------------------------------------------
-- WEEKLY_PLANS — equivalente a state.planes / hgw_planes (plan completo,
-- no solo el registro — corrige la misma limitación ya resuelta en frontend)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_plans (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  objetivo     TEXT,
  fecha        TEXT NOT NULL,
  dias_json    TEXT NOT NULL,   -- [{dia, desayuno, almuerzo, cena, hidratacion, actividad, recordatorio}, x7]
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(client_id)   -- un plan semanal vigente por cliente, igual que en frontend
);
CREATE INDEX IF NOT EXISTS idx_weeklyplans_user ON weekly_plans(user_id);

-- ----------------------------------------------------------------------------
-- SPORTS_PLANS — equivalente a state.planesDeportivos / hgw_planes_deportivos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sports_plans (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id         TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  fecha             TEXT NOT NULL,
  datos_json        TEXT NOT NULL,   -- {frecuencia, duracion, cardio, fuerza, movilidad, descanso, progresion, requiereValoracion}
  justificacion_json TEXT NOT NULL DEFAULT '[]',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(client_id)   -- un plan deportivo vigente por cliente, igual que en frontend
);
CREATE INDEX IF NOT EXISTS idx_sportsplans_user ON sports_plans(user_id);

-- ----------------------------------------------------------------------------
-- CONSULTATION_REQUESTS — equivalente a state.solicitudes / hgw_solicitudes
-- Se crean desde el acceso PÚBLICO (sin login). user_id identifica a qué
-- emprendedor/negocio pertenece la solicitud (hoy: el único usuario;
-- mañana: se resolverá por subdominio o slug de negocio en el Worker).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultation_requests (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  codigo       TEXT NOT NULL UNIQUE,   -- Ej: KAIROS-8F42X
  nombre       TEXT NOT NULL,
  telefono     TEXT NOT NULL,
  correo       TEXT,
  negocio      TEXT,
  ciudad       TEXT,
  motivo       TEXT,
  preferencia  TEXT,
  fecha        TEXT NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','atendida')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_consultreq_user ON consultation_requests(user_id);

-- ----------------------------------------------------------------------------
-- SPA_RESERVATIONS — equivalente a state.spaReservas / hgw_spa_reservas
-- Igual que consultation_requests: se crean desde el acceso público.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS spa_reservations (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  codigo         TEXT NOT NULL UNIQUE,   -- Ej: SPA-KR-84F29
  tipo_id        TEXT NOT NULL,
  tipo_nombre    TEXT NOT NULL,
  fecha          TEXT NOT NULL,
  hora           TEXT NOT NULL,
  nombre         TEXT NOT NULL,
  telefono       TEXT NOT NULL,
  correo         TEXT,
  observaciones  TEXT,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','confirmada','reprogramada','cancelada','atendida')),
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sparesv_user  ON spa_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_sparesv_fecha ON spa_reservations(fecha);

-- ============================================================================
-- NOTA IMPORTANTE SOBRE DATOS INICIALES
-- ============================================================================
-- Este archivo NO inserta ningún usuario ni contraseña real (nunca deben
-- quedar credenciales reales en un archivo versionado en GitHub). El usuario
-- inicial ("HGW Rafer") se crea con un comando aparte, generando el hash
-- localmente. El procedimiento exacto está en el informe de esta entrega,
-- no en este repositorio.
-- ============================================================================
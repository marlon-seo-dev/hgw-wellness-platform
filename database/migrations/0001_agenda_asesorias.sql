-- ============================================================================
-- MIGRACIÓN 0001 — Agenda de asesorías (fecha y hora de la cita)
-- ============================================================================
-- Agrega a consultation_requests la fecha y hora agendadas, necesarias para
-- validar disponibilidad y evitar dobles reservas. Es ADITIVA: no borra ni
-- modifica datos existentes (las solicitudes antiguas quedan con la cita en
-- NULL y no bloquean ningún horario).
--
-- Ejecutar UNA sola vez en producción, ANTES de desplegar el nuevo Worker:
--   npx wrangler d1 execute hgw_wellness_db --remote --file=database/migrations/0001_agenda_asesorias.sql
-- (Si se ejecuta dos veces, el ALTER TABLE fallará con "duplicate column":
--  eso significa que ya estaba aplicada y no hay nada más que hacer.)
-- ============================================================================

ALTER TABLE consultation_requests ADD COLUMN fecha_cita TEXT;
ALTER TABLE consultation_requests ADD COLUMN hora_cita TEXT;

CREATE INDEX IF NOT EXISTS idx_consultreq_agenda ON consultation_requests(user_id, fecha_cita, hora_cita);
CREATE INDEX IF NOT EXISTS idx_sparesv_agenda ON spa_reservations(user_id, fecha, hora);

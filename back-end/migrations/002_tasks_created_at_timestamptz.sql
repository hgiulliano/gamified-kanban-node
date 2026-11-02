-- Migration: usar TIMESTAMPTZ em tasks.created_at
--
-- Motivo: a coluna era "TIMESTAMP" (sem timezone). O Postgres salvava o valor
-- em UTC, mas o driver do Node interpretava como horário local (UTC-3),
-- então a API devolvia datas 3 horas no futuro ("-1d atrás" na UI).
--
-- Os valores antigos foram gerados por CURRENT_TIMESTAMP no container (UTC),
-- então reinterpretamos como UTC ao converter.

ALTER TABLE tasks
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
  USING created_at AT TIME ZONE 'UTC';

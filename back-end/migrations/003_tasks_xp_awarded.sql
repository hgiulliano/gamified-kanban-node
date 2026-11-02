-- Migration: garantir que cada task conceda XP uma única vez
--
-- Antes, o XP era dado sempre que a task entrava em READY. Dava para
-- "farmar" XP movendo READY -> REVIEW -> READY repetidamente.
--
-- A coluna xp_awarded marca que a recompensa daquela task já foi paga.
-- O XP não é removido se a task sair de READY: ele foi conquistado.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Tasks que já estavam em READY já concederam XP no passado
UPDATE tasks SET xp_awarded = TRUE WHERE status = 'READY' AND xp_awarded = FALSE;

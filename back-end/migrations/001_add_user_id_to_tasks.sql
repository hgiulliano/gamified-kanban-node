-- Migration: Adicionar user_id na tabela tasks com FK para users
-- Execute se já tiver banco criado antes desta migration

ALTER TABLE tasks 
ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Índice para performance em queries por usuário
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Atualiza tasks existentes para pertencer ao player1 (id=1)
UPDATE tasks SET user_id = 1 WHERE user_id IS NULL;

-- Torna obrigatório para futuras inserts
ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
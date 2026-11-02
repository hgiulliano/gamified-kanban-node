-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0
);

-- Tabela de tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'DOING', 'REVIEW', 'READY')),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- TRUE quando o XP dessa task já foi pago (evita farmar XP voltando para READY)
    xp_awarded BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índice para queries por usuário
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Usuário de teste para desenvolvimento
INSERT INTO users (username) VALUES ('player1') ON CONFLICT (username) DO NOTHING;
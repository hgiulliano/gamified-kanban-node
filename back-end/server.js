// 1. Imports
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

// 2. Carrega variáveis de ambiente
dotenv.config();

const { Pool } = pg;

// 3. Configuração do Pool de Conexões
// Pool reutiliza conexões → melhor performance que abrir/fechar a cada query
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // fecha conexões ociosas após 30s
  connectionTimeoutMillis: 2000 // timeout para conseguir conexão
});

// 4. Testar conexão na inicialização
pool.query('SELECT NOW()')
  .then(() => console.log('[db] Conectado ao PostgreSQL'))
  .catch(err => console.error('[db] Erro ao conectar no PostgreSQL:', err));

// 5. App Express
const app = express();
const PORT = process.env.PORT || 3000;

// 6. Middlewares
// CORS: aceita a(s) URL(s) de FRONTEND_URL (separadas por vírgula).
// Em desenvolvimento também libera qualquer porta de localhost, porque o Vite
// troca de porta sozinho (5173, 5174, 5175...) quando a anterior está ocupada.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requisições sem Origin (curl, Postman, healthcheck) são permitidas
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (process.env.NODE_ENV !== 'production' && isLocalhost) {
      return callback(null, true);
    }

    return callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: false
};
app.use(cors(corsOptions));
app.use(express.json()); // Parseia JSON no body das requisições

// ============================================
// HELPERS DE RESPONSE (REST Clássico Direto)
// ============================================

// Sucesso 200
const ok = (res, data) => res.status(200).json(data);

// Criado 201
const created = (res, data) => res.status(201).json(data);

// Erro 400 - Bad Request (validação)
const badRequest = (res, message) => res.status(400).json({ error: message });

// Erro 404 - Not Found
const notFound = (res, message = 'Recurso não encontrado') => res.status(404).json({ error: message });

// Erro 500 - Internal Server Error
const serverError = (res, message = 'Erro interno do servidor') => res.status(500).json({ error: message });

// ============================================
// VALIDAÇÕES REUTILIZÁVEIS
// ============================================

// Valida username: 3-50 chars, alfanumérico + underscore
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return 'Username é obrigatório e deve ser uma string';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    return 'Username deve ter entre 3 e 50 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Username deve conter apenas letras, números e underscore (_)';
  }
  return null; // válido
};

// ============================================
// ROTAS
// ============================================

// 7. Healthcheck
app.get('/health', (req, res) => {
  ok(res, { status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ROTAS DE USUÁRIO
// ============================================

// 8. GET /users/:id - Busca usuário por ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return badRequest(res, 'ID do usuário inválido');
    }

    const result = await pool.query(
      'SELECT id, username, level, current_xp FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return notFound(res, 'Usuário não encontrado');
    }

    ok(res, result.rows[0]);
  } catch (err) {
    console.error('Erro GET /users/:id:', err);
    serverError(res);
  }
});

// 9. POST /users - Cria novo usuário
app.post('/users', async (req, res) => {
  try {
    const { username } = req.body;

    // Validação
    const validationError = validateUsername(username);
    if (validationError) {
      return badRequest(res, validationError);
    }

    const trimmedUsername = username.trim();

    // Insere usuário (level e current_xp têm DEFAULT no banco)
    const result = await pool.query(
      `INSERT INTO users (username) VALUES ($1)
       RETURNING id, username, level, current_xp`,
      [trimmedUsername]
    );

    created(res, result.rows[0]);
  } catch (err) {
    console.error('Erro POST /users:', err);
    // Violação de UNIQUE constraint (username duplicado)
    if (err.code === '23505') {
      return badRequest(res, 'Username já existe');
    }
    serverError(res);
  }
});

// ============================================
// ROTAS DE TASKS
// ============================================

// 10. GET /tasks - Lista todas as tasks (com join no user)
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, t.title, t.status, t.created_at,
        t.user_id, t.xp_awarded,
        u.username,
        u.level,
        u.current_xp
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    ok(res, result.rows);
  } catch (err) {
    console.error('Erro GET /tasks:', err);
    serverError(res);
  }
});

// 11. POST /tasks - Cria nova task
app.post('/tasks', async (req, res) => {
  try {
    const { title, user_id } = req.body;

    // Validações
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return badRequest(res, 'Title é obrigatório e não pode ser vazio');
    }
    if (title.length > 255) {
      return badRequest(res, 'Title deve ter no máximo 255 caracteres');
    }
    if (!user_id || !Number.isInteger(Number(user_id))) {
      return badRequest(res, 'user_id é obrigatório e deve ser um número inteiro');
    }

    // Verifica se user existe
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return notFound(res, 'Usuário não encontrado');
    }

    // Insere task (status default TODO via banco)
    const result = await pool.query(
      `INSERT INTO tasks (title, user_id) VALUES ($1, $2) 
       RETURNING id, title, status, user_id, created_at`,
      [title.trim(), user_id]
    );

    created(res, result.rows[0]);
  } catch (err) {
    console.error('Erro POST /tasks:', err);
    // Violação de FK ou CHECK constraint
    if (err.code === '23503') return badRequest(res, 'user_id inválido');
    if (err.code === '23514') return badRequest(res, 'Status inválido');
    serverError(res);
  }
});

// 12. PATCH /tasks/:id/status - Atualiza status + lógica XP (transação)
app.patch('/tasks/:id/status', async (req, res) => {
  const client = await pool.connect(); // Pega conexão dedicada para transação
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validação de status
    const validStatuses = ['TODO', 'DOING', 'REVIEW', 'READY'];
    if (!status || !validStatuses.includes(status)) {
      return badRequest(res, `Status inválido. Valores permitidos: ${validStatuses.join(', ')}`);
    }

    // Validação de ID
    const taskId = Number(id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return badRequest(res, 'ID da task inválido');
    }

    // Inicia transação
    await client.query('BEGIN');

    // 1. Verifica se task existe e pega user_id atual
    const taskResult = await client.query(
      'SELECT id, title, status, user_id, xp_awarded FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFound(res, 'Task não encontrada');
    }

    const task = taskResult.rows[0];
    const oldStatus = task.status;
    const userId = task.user_id;

    // Se status não mudou, não faz nada (mas retorna sucesso)
    if (oldStatus === status) {
      await client.query('COMMIT');
      return ok(res, { 
        id: task.id, 
        title: task.title, 
        status: task.status, 
        user_id: task.user_id,
        message: 'Status já era este valor' 
      });
    }

    // 2. Atualiza status da task
    await client.query(
      'UPDATE tasks SET status = $1 WHERE id = $2',
      [status, taskId]
    );

    // 3. Se moveu PARA READY → ganha 50 XP (uma única vez por task)
    let xpGained = 0;
    let levelUp = false;
    let newLevel = null;
    let newXp = null;

    if (status === 'READY' && !task.xp_awarded) {
      // Marca a task como premiada de forma ATÔMICA. Se duas requisições
      // concorrentes chegarem aqui, só uma ganha o UPDATE (rowCount === 1),
      // então o XP nunca é pago duas vezes.
      const claim = await client.query(
        `UPDATE tasks SET xp_awarded = TRUE
         WHERE id = $1 AND xp_awarded = FALSE
         RETURNING id`,
        [taskId]
      );

      if (claim.rowCount === 1) {
        // Atualiza XP do usuário
        const xpResult = await client.query(`
          UPDATE users 
          SET current_xp = current_xp + 50
          WHERE id = $1
          RETURNING level, current_xp
        `, [userId]);

        let currentXp = xpResult.rows[0].current_xp;
        let currentLevel = xpResult.rows[0].level;
        xpGained = 50;

        // Verifica level up (a cada 100 XP)
        while (currentXp >= 100) {
          currentXp -= 100;
          currentLevel += 1;
          levelUp = true;
        }

        // Se houve level up, atualiza no banco
        if (levelUp) {
          await client.query(
            'UPDATE users SET level = $1, current_xp = $2 WHERE id = $3',
            [currentLevel, currentXp, userId]
          );
        }

        newLevel = currentLevel;
        newXp = currentXp;
      }
    }

    // Commit da transação
    await client.query('COMMIT');

    // Busca task atualizada para retornar
    const updatedTask = await pool.query(
      `SELECT t.id, t.title, t.status, t.user_id, t.created_at, t.xp_awarded,
              u.username, u.level, u.current_xp
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [taskId]
    );

    ok(res, {
      task: updatedTask.rows[0],
      xp_gained: xpGained,
      level_up: levelUp,
      new_level: newLevel,
      new_xp: newXp
    });

  } catch (err) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro PATCH /tasks/:id/status:', err);
    
    if (err.code === '23514') return badRequest(res, 'Status inválido');
    serverError(res);
  } finally {
    // Sempre libera a conexão de volta ao pool
    client.release();
  }
});

// ============================================
// NOVAS ROTAS DE TASKS (Editar/Excluir)
// ============================================

// 13. PATCH /tasks/:id - Atualiza task (título, etc.)
app.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const taskId = Number(id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return badRequest(res, 'ID da task inválido');
    }

    // Verifica se task existe
    const taskCheck = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return notFound(res, 'Task não encontrada');
    }

    // Validações
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return badRequest(res, 'Title é obrigatório e não pode ser vazio');
      }
      if (title.length > 255) {
        return badRequest(res, 'Title deve ter no máximo 255 caracteres');
      }
    }

    // Atualiza
    const result = await pool.query(
      `UPDATE tasks SET title = COALESCE($1, title) WHERE id = $2
       RETURNING id, title, status, user_id, created_at`,
      [title?.trim(), taskId]
    );

    // Busca com join para retornar dados completos
    const updated = await pool.query(
      `SELECT t.id, t.title, t.status, t.user_id, t.created_at, t.xp_awarded,
              u.username, u.level, u.current_xp
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [taskId]
    );

    ok(res, updated.rows[0]);
  } catch (err) {
    console.error('Erro PATCH /tasks/:id:', err);
    serverError(res);
  }
});

// 14. DELETE /tasks/:id - Exclui task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const taskId = Number(id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return badRequest(res, 'ID da task inválido');
    }

    // Verifica se existe
    const taskCheck = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskCheck.rows.length === 0) {
      return notFound(res, 'Task não encontrada');
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    ok(res, { message: 'Task excluída com sucesso', id: taskId });
  } catch (err) {
    console.error('Erro DELETE /tasks/:id:', err);
    serverError(res);
  }
});

// 15. Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`[server] Rodando em http://localhost:${PORT}`);
});

// Mensagem clara em vez de stack trace quando a porta já está ocupada
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] A porta ${PORT} já está em uso.`);
    console.error('[server] Encerre o processo antigo ou defina outra PORT no .env');
    process.exit(1);
  }
  throw err;
});
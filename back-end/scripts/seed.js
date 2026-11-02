// ============================================
// SEED — Dados de demonstração
// ============================================
//
// Uso: npm run seed
//
// Cria dois usuários de demonstração com tasks espalhadas pelas 4 colunas.
// É idempotente: se o usuário já tem tasks, não duplica.
//
// As tasks em READY já vêm com xp_awarded = TRUE, coerente com a regra
// de que cada task paga XP uma única vez.

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const USERS = [
  {
    username: 'demo_ana',
    level: 4,
    current_xp: 35,
    tasks: [
      ['Definir escopo do MVP', 'TODO', 9],
      ['Criar protótipo do board', 'TODO', 8],
      ['Escrever o README', 'TODO', 7],
      ['Implementar drag and drop', 'DOING', 6],
      ['Ajustar layout responsivo', 'DOING', 5],
      ['Revisar cálculo de XP', 'REVIEW', 3],
      ['Configurar Docker + Postgres', 'READY', 2],
      ['Modelar schema de tasks', 'READY', 1],
      ['Criar endpoint de usuários', 'READY', 0],
    ],
  },
  {
    username: 'demo_bruno',
    level: 2,
    current_xp: 80,
    tasks: [
      ['Escrever testes do backend', 'TODO', 4],
      ['Documentar a API', 'DOING', 1],
      ['Configurar CI no GitHub', 'READY', 2],
    ],
  },
];

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 1,
});

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const user of USERS) {
      const userResult = await client.query(
        `INSERT INTO users (username, level, current_xp)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE
           SET level = EXCLUDED.level, current_xp = EXCLUDED.current_xp
         RETURNING id`,
        [user.username, user.level, user.current_xp]
      );
      const userId = userResult.rows[0].id;

      const countResult = await client.query(
        'SELECT COUNT(*)::int AS total FROM tasks WHERE user_id = $1',
        [userId]
      );

      if (countResult.rows[0].total > 0) {
        console.log(`[seed] ${user.username} já tem tasks, pulando.`);
        continue;
      }

      for (const [title, status, daysAgo] of user.tasks) {
        await client.query(
          `INSERT INTO tasks (title, status, user_id, created_at, xp_awarded)
           VALUES ($1, $2, $3, NOW() - make_interval(days => $4), $5)`,
          [title, status, userId, daysAgo, status === 'READY']
        );
      }

      console.log(`[seed] ${user.username}: ${user.tasks.length} tasks criadas.`);
    }

    await client.query('COMMIT');
    console.log('[seed] Pronto.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[seed] Erro:', err.message);
  process.exit(1);
});

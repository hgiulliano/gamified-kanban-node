// ============================================
// MIGRATE — Aplica as migrations pendentes
// ============================================
//
// Uso:
//   npm run migrate
//   npm run migrate:status
//
// Controle: cada arquivo .sql de `migrations/` é aplicado uma única vez e
// registrado na tabela `schema_migrations`.
//
// Baseline: se o banco já existe (tabela `tasks`) mas o controle ainda não,
// registramos as migrations como aplicadas. É o caso de quem já tinha o
// projeto rodando antes deste script existir.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 1,
});

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return rows.length > 0;
}

async function listMigrations() {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith('.sql')).sort();
}

async function main() {
  const showStatus = process.argv.includes('--status');
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = await listMigrations();
    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));

    // Baseline para bancos criados antes do controle de migrations
    if (applied.size === 0 && (await tableExists(client, 'tasks'))) {
      console.log('[migrate] Banco já existente detectado: aplicando baseline.');
      for (const filename of files) {
        await client.query(
          `INSERT INTO schema_migrations (filename) VALUES ($1)
           ON CONFLICT (filename) DO NOTHING`,
          [filename]
        );
      }
      console.log(`[migrate] ${files.length} migration(s) marcada(s) como aplicada(s).`);
      return;
    }

    const pending = files.filter((f) => !applied.has(f));

    if (showStatus) {
      console.log(`[migrate] ${applied.size} aplicada(s), ${pending.length} pendente(s).`);
      for (const f of files) {
        console.log(`  ${applied.has(f) ? '[ok]  ' : '[pend]'} ${f}`);
      }
      return;
    }

    if (pending.length === 0) {
      console.log('[migrate] Nada pendente. Banco atualizado.');
      return;
    }

    for (const filename of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
      console.log(`[migrate] Aplicando ${filename}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [filename]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Falha em ${filename}: ${err.message}`);
      }
    }

    console.log(`[migrate] ${pending.length} migration(s) aplicada(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[migrate] Erro:', err.message);
  process.exit(1);
});

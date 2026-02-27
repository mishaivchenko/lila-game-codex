import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | undefined;
let migrationsPromise: Promise<void> | undefined;

const getSslConfig = (): false | { rejectUnauthorized: false } | undefined => {
  if (process.env.DATABASE_SSL === 'false') {
    return false;
  }
  if (process.env.DATABASE_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  return undefined;
};

const getPool = (): Pool | undefined => {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: getSslConfig(),
    });
  }

  return pool;
};

const getMigrationsDir = (): string => {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '../../migrations');
};

const ensureMigrationsTable = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const runPendingMigrations = async (): Promise<void> => {
  const activePool = getPool();
  if (!activePool) {
    return;
  }

  const client = await activePool.connect();
  try {
    await ensureMigrationsTable(client);
    const appliedResult = await client.query<{ id: string }>('SELECT id FROM schema_migrations');
    const applied = new Set(appliedResult.rows.map((row) => row.id));
    const migrationFiles = (await readdir(getMigrationsDir()))
      .filter((entry) => entry.endsWith('.sql'))
      .sort((left, right) => left.localeCompare(right));

    for (const migrationFile of migrationFiles) {
      if (applied.has(migrationFile)) {
        continue;
      }
      const sql = await readFile(path.join(getMigrationsDir(), migrationFile), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migrationFile]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }
};

export const isPostgresEnabled = (): boolean => Boolean(process.env.DATABASE_URL);

export const ensureDbReady = async (): Promise<void> => {
  if (!isPostgresEnabled()) {
    return;
  }
  migrationsPromise ??= runPendingMigrations();
  await migrationsPromise;
};

export interface DbHealthStatus {
  enabled: boolean;
  ok: boolean;
  error?: string;
}

export const getDbHealthStatus = async (): Promise<DbHealthStatus> => {
  if (!isPostgresEnabled()) {
    return { enabled: false, ok: true };
  }
  const activePool = getPool();
  if (!activePool) {
    return { enabled: true, ok: false, error: 'Pool is not initialized' };
  }
  try {
    await activePool.query('SELECT 1');
    return { enabled: true, ok: true };
  } catch (error) {
    return {
      enabled: true,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const queryDb = async <T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> => {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('DATABASE_URL is not configured');
  }
  await ensureDbReady();
  const result = await activePool.query<T>(text, params);
  return result.rows;
};

export const withDbTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('DATABASE_URL is not configured');
  }
  await ensureDbReady();
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closeDbPool = async (): Promise<void> => {
  if (!pool) {
    return;
  }
  await pool.end();
  pool = undefined;
  migrationsPromise = undefined;
};

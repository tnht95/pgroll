import postgres, { type Sql } from 'postgres';

import { Migrator } from '../src/index.js';

describe('Test Postgres.js client', () => {
  let dbClient: Sql;

  beforeAll(() => {
    dbClient = postgres({
      host: '127.0.0.1',
      port: 5432,
      database: 'pgroll',
      user: 'pgrolluser',
      password: 'pgrollpassword',
      // Pin the pool to a single connection so `SET search_path` and the
      // Migrator's reserved connection share the same session — otherwise the
      // search_path tests would depend on incidental connection reuse.
      max: 1,
      onnotice: () => {
        // do nothing
      }
    });
  });

  afterAll(async () => {
    await dbClient.end();
  });

  beforeEach(async () => {
    // Reset to a clean slate so every test is isolated regardless of order or
    // what a previous test/file left behind: drop all user schemas (everything
    // except the Postgres system schemas), recreate an empty `public`, and
    // restore the default search_path (the search_path tests mutate it).
    const schemas = await dbClient`
      SELECT nspname FROM pg_namespace
      WHERE nspname <> 'information_schema' AND left(nspname, 3) <> 'pg_'`;
    for (const { nspname } of schemas) {
      await dbClient`DROP SCHEMA IF EXISTS ${dbClient(nspname)} CASCADE`;
    }
    await dbClient`CREATE SCHEMA public`;
    await dbClient`SET search_path TO public`;
  });

  test('uses public schema by default', async () => {
    const migrator = new Migrator(dbClient, `${process.cwd()}/test/migrations/`);
    await migrator.up();
    expect(await dbClient`SELECT COUNT(*)::INT FROM public.migrations`).toEqual([{ count: 5 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'public'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 4 }]);
    await migrator.down();
    expect(await dbClient`SELECT COUNT(*)::INT FROM public.migrations`).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'public'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 0 }]);
  });

  test('uses configured schema', async () => {
    const migrator = new Migrator(dbClient, `${process.cwd()}/test/migrations/`, 'test');
    await migrator.up();
    expect(await dbClient`SELECT COUNT(*)::INT FROM test.migrations`).toEqual([{ count: 5 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'public'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 4 }]);
    await migrator.down();
    expect(await dbClient`SELECT COUNT(*)::INT FROM test.migrations`).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'public'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 0 }]);
  });

  test('set search path with default schema', async () => {
    const migrator = new Migrator(dbClient, `${process.cwd()}/test/migrations/`);

    await dbClient`SET search_path TO test`;
    await dbClient`CREATE SCHEMA test`;

    await migrator.up();
    expect(await dbClient`SELECT COUNT(*)::INT FROM public.migrations`).toEqual([{ count: 5 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'test' AND table_name = 'migrations';`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'test'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 4 }]);

    await migrator.down();
    expect(await dbClient`SELECT COUNT(*)::INT FROM public.migrations`).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'test' AND table_name = 'migrations';`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT FROM information_schema.tables
           WHERE table_schema = 'test'
           AND (
             table_name = 'users'
             OR table_name = 'games'
             OR table_name = 'news'
             OR table_name = 'classes')`
    ).toEqual([{ count: 0 }]);
  });

  test('set search path with specified schema', async () => {
    const migrator = new Migrator(dbClient, `${process.cwd()}/test/migrations/`, 'test');

    await dbClient`SET search_path TO my_path`;
    await dbClient`CREATE SCHEMA my_path`;

    await migrator.up();
    expect(await dbClient`SELECT COUNT(*)::INT FROM test.migrations`).toEqual([{ count: 5 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'my_path'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
      FROM information_schema.tables
      WHERE table_schema = 'my_path'
      AND (
        table_name = 'users'
        OR table_name = 'games'
        OR table_name = 'news'
        OR table_name = 'classes')`
    ).toEqual([{ count: 4 }]);

    await migrator.down();
    expect(await dbClient`SELECT COUNT(*)::INT FROM test.migrations`).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
        FROM information_schema.tables
        WHERE table_schema = 'my_path'
        AND table_name = 'migrations'`
    ).toEqual([{ count: 0 }]);
    expect(
      await dbClient`SELECT COUNT(*)::INT
      FROM information_schema.tables
      WHERE table_schema = 'my_path'
      AND (
        table_name = 'users'
        OR table_name = 'games'
        OR table_name = 'news'
        OR table_name = 'classes')`
    ).toEqual([{ count: 0 }]);
  });
});

import postgres, { type Sql } from 'postgres';

import { Migrator } from '../src/index.js';

describe('Test Postgres.js client', () => {
  let dbCLient: Sql;

  beforeAll(() => {
    dbCLient = postgres({
      host: '127.0.0.1',
      port: 5432,
      database: 'pgroll',
      user: 'pgrolluser',
      password: 'pgrollpassword',
      onnotice: () => {
        // do nothing
      }
    });
  });

  afterAll(async () => {
    await dbCLient.end();
  });

  test('uses public schema by default', async () => {
    const migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`);

    await migrator.up();
    expect(
      await dbCLient`
    SELECT COUNT(*)
    FROM public.migrations
  `
    ).toEqual([{ count: '5' }]);
    await migrator.down();
    await dbCLient`DROP TABLE IF EXISTS public.migrations`;
  });

  test('uses configured schema', async () => {
    const migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`, 'abc');

    await migrator.up();

    expect(
      await dbCLient`
    SELECT COUNT(*)
    FROM abc.migrations
  `
    ).toEqual([{ count: '5' }]);

    expect(
      await dbCLient`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'migrations'
    );
  `
    ).toEqual([{ exists: false }]);

    await migrator.down();

    await dbCLient`DROP SCHEMA IF EXISTS abc CASCADE`;
  });

  test('set search path with default schema', async () => {
    const migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`);

    await dbCLient`SET search_path TO user_path`;
    await dbCLient`CREATE SCHEMA IF NOT EXISTS user_path`;

    await migrator.up();

    // check if migrations table has all 5 versions
    expect(
      await dbCLient`
      SELECT COUNT(*)
      FROM public.migrations
    `
    ).toEqual([{ count: '5' }]);

    // there should be no migrations table in user's path
    expect(
      await dbCLient`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'user_path'
        AND table_name = 'migrations'
      );
    `
    ).toEqual([{ exists: false }]);

    // check if user's tables is in the right schema
    expect(
      await dbCLient`
    SELECT COUNT(*)::int AS table_count
    FROM information_schema.tables
    WHERE table_schema = 'user_path'
  `
    ).toEqual([{ table_count: 4 }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'user_path'   
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'user_path'   
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'user_path'   
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'user_path'  
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: true }]);

    await migrator.down();
    await dbCLient`DROP SCHEMA IF EXISTS public CASCADE`;
    await dbCLient`DROP SCHEMA IF EXISTS user_path CASCADE`;
  });

  test('set search path with specified schema', async () => {
    const migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`, 'test');

    await dbCLient`SET search_path TO path`;
    await dbCLient`CREATE SCHEMA IF NOT EXISTS path`;

    await migrator.up();

    // check if migrations table has all 5 versions
    expect(
      await dbCLient`
      SELECT COUNT(*)
      FROM test.migrations
    `
    ).toEqual([{ count: '5' }]);

    // there should be no migrations table in public schema
    expect(
      await dbCLient`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'migrations'
      );
    `
    ).toEqual([{ exists: false }]);

    // there should be no migrations table in user's path
    expect(
      await dbCLient`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'path'
        AND table_name = 'migrations'
      );
    `
    ).toEqual([{ exists: false }]);

    // check if user's tables is in the right schema
    expect(
      await dbCLient`
    SELECT COUNT(*)::int AS table_count
    FROM information_schema.tables
    WHERE table_schema = 'path'
  `
    ).toEqual([{ table_count: 4 }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'path'   
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'path'   
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'path'   
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'path'  
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: true }]);

    await migrator.down();
    await dbCLient`DROP SCHEMA IF EXISTS path CASCADE`;
  });
});

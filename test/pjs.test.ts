import postgres, { Sql } from 'postgres';

import { IMigrator, Migrator } from '@/index';

describe('Test Postgres.js client', () => {
  let dbCLient: Sql;
  let migrator: IMigrator;

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
    migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`);
  });

  afterAll(async () => {
    await dbCLient.end();
  });

  test('up success', async () => {
    await migrator.up();

    expect(await migrator.getCurrentVersion()).toBe(5);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: true }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: true }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: true }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: true }]);

    await migrator.down();
  });

  test('down success', async () => {
    await migrator.up();
    expect(await migrator.getCurrentVersion()).toBe(5);

    await migrator.down();
    expect(await migrator.getCurrentVersion()).toBe(0);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: false }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: false }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: false }]);

    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: false }]);
  });

  test('multiple up', async () => {
    await Promise.all([migrator.up(), migrator.up(), migrator.up()]);
    expect(await migrator.getCurrentVersion()).toBe(5);
  });

  test('multiple down', async () => {
    await migrator.up();
    await Promise.all([migrator.down(), migrator.down(), migrator.down()]);
    expect(await migrator.getCurrentVersion()).toBe(0);

    expect(await migrator.getCurrentVersion()).toBe(5);
  });

  test('go success', async () => {
    await migrator.down();
    expect(await migrator.getCurrentVersion()).toBe(0);

    await migrator.go(2);
    expect(await migrator.getCurrentVersion()).toBe(2);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: true }]);

    await migrator.go(3);
    expect(await migrator.getCurrentVersion()).toBe(3);

    await migrator.go(7);
    expect(await migrator.getCurrentVersion()).toBe(5);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: true }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: true }]);

    await migrator.go(2);
    expect(await migrator.getCurrentVersion()).toBe(2);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'news');`
    ).toEqual([{ exists: false }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'classes');`
    ).toEqual([{ exists: false }]);

    await migrator.go(0);
    expect(await migrator.getCurrentVersion()).toBe(0);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'users');`
    ).toEqual([{ exists: false }]);
    expect(
      await dbCLient`SELECT EXISTS (SELECT 1 FROM information_schema.tables 
                           WHERE  table_schema = 'public'   -- Replace with your schema name if different
                           AND    table_name   = 'games');`
    ).toEqual([{ exists: false }]);
  });
});

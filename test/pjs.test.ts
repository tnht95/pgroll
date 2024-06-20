import postgres from 'postgres';

import { Migrator } from '@/index';

const dbCLient = postgres({
  host: '127.0.0.1',
  user: 'service',
  port: 5432,
  password: 'password',
  database: 'tpp'
});

const migrator = new Migrator(dbCLient, `${process.cwd()}/test/migrations/`);

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

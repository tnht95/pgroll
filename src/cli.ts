/* eslint-disable unicorn/no-process-exit, no-console */

import * as process from 'node:process';

import { Command } from 'commander';
import postgres from 'postgres';

import { createFile } from './utils';

import { IMigrator, Migrator } from './index';

const program = new Command();

let migrator: IMigrator;

program
  .version('0.0.1')
  .description('Database migration tool')
  .option(
    '-d, --migrationDir <filepath>',
    'Specify migration directory(Default: ./migration)'
  )
  .hook('preAction', cmd => {
    const opts = cmd.opts<{ migrationDir: string }>();
    migrator = new Migrator(postgres(), opts.migrationDir);
  });

program
  .command('up')
  .description('Run all up migrations')
  .action(async () => {
    try {
      await migrator.up({ eventHandler: console.log });
      console.log('Migrations up completed successfully.');
    } catch (error) {
      console.error('Error during migrations up:', error);
      process.exit(1);
    }
  });

program
  .command('down')
  .description('Run all down migrations')
  .action(async () => {
    try {
      await migrator.down({ eventHandler: console.log });
      console.log('Migrations down completed successfully.');
    } catch (error) {
      console.error('Error during migrations down:', error);
      process.exit(1);
    }
  });

program
  .command('create')
  .description(
    'Generate migration files in the migrations folder: one for applying changes (up), and one for reverting them (down).'
  )
  .argument('<filename>', 'file name to be created')
  .action((fileName: string) => {
    const result = createFile(migrator.migrationsDir, fileName);
    for (const f of result)
      console.log(`Successfully created migration files: ${f}`);
  });

program
  .command('go')
  .description(
    'Navigate to a specific version; version 0 performs a rollback, reverting all migrations.'
  )
  .argument('<version>', 'version to migrate to')
  .action(async (version: string) => {
    const parsedVersion = Number.parseInt(version, 10);

    if (Number.isNaN(parsedVersion)) {
      console.error('Invalid version number.');
      process.exit(1);
    }

    try {
      await migrator.go(parsedVersion, { eventHandler: console.log });
    } catch (error) {
      console.error('Error during migrations:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);

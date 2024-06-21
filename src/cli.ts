/* eslint-disable unicorn/no-process-exit */

import * as process from 'node:process';

import { Command } from 'commander';
import postgres from 'postgres';

import { Migrator } from '@/index';

const program = new Command();

const migrator = new Migrator(postgres(), `${process.cwd()}/migrations`);

program.version('1.0.0').description('Database migration tool');

program
  .command('up')
  .description('Run all up migrations')
  .action(async () => {
    try {
      await migrator.up();
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
      await migrator.down();
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
    migrator.create(fileName);
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
      await migrator.go(parsedVersion);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);

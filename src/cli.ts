#!/usr/bin/env node
/* eslint-disable no-console */

import * as process from 'node:process';

import { Command } from 'commander';
import postgres from 'postgres';

import { type IMigrator, Migrator } from './index.ts';
import { createFile } from './utils.ts';

const program = new Command();

let migrator: IMigrator;

program
  .version('0.0.9')
  .description('Database migration tool')
  .option('-d, --migrationDir <filepath>', 'Specify migration directory (Default: ./migrations)')
  .option('-u, --url <url>', 'PostgreSQL connection URL (overrides PG* env vars)')
  .option('-s, --schema <schema>', 'Specify schema (Default: public)')
  .hook('preAction', cmd => {
    const opts = cmd.opts<{ migrationDir?: string; url?: string; schema?: string }>();
    const pgOptions = {
      onnotice: () => {
        // do nothing
      }
    };
    migrator = new Migrator(
      opts.url ? postgres(opts.url, pgOptions) : postgres(pgOptions),
      opts.migrationDir,
      opts.schema
    );
  });

program
  .command('up')
  .description('Run all up migrations')
  .action(async () => {
    try {
      await migrator.up({ eventHandler: console.log });
      console.log('Migrations up completed successfully.');
      process.exit(0);
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
      process.exit(0);
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
    for (const f of result) console.log(`Successfully created migration files: ${f}`);
    process.exit(0);
  });

program
  .command('go')
  .description('Navigate to a specific version; version 0 performs a rollback, reverting all migrations.')
  .argument('<version>', 'version to migrate to')
  .action(async (version: string) => {
    const parsedVersion = Number(version);

    if (!Number.isSafeInteger(parsedVersion) || parsedVersion < 0) {
      console.error('Invalid version number.');
      process.exit(1);
    }

    try {
      await migrator.go(parsedVersion, { eventHandler: console.log });
      process.exit(0);
    } catch (error) {
      console.error('Error during migrations:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);

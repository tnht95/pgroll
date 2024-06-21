import fs from 'node:fs';
import path from 'node:path';

import { Sql } from 'postgres';

import { createFolderIfNotExists, Direction, getMigrationFiles } from '@/utils';

export interface IMigrator {
  up: () => Promise<void>;
  down: () => Promise<void>;
  create: (name: string) => void;
  go: (version: number) => Promise<void>;
  getCurrentVersion: () => Promise<number>;
}

export class Migrator implements IMigrator {
  private readonly dbClient: Sql;
  private readonly migrationsDir: string;

  constructor(dbClient: Sql, migrationsDir: string) {
    this.dbClient = dbClient;
    this.migrationsDir = migrationsDir;
  }

  async migrationTableInit(): Promise<void> {
    await this.dbClient`CREATE TABLE IF NOT EXISTS migrations(
                        name varchar(500) PRIMARY KEY,
                        version smallint NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
  }

  create(name: string): void {
    const timestamp = new Date().toISOString().replaceAll(/[.:TZ-]/g, '');
    createFolderIfNotExists(this.migrationsDir);

    // make up file
    let fileName = `${timestamp}_${name}_up.sql`;
    let filePath = path.join(this.migrationsDir, fileName);
    fs.writeFileSync(filePath, '-- up SQL here');

    // make down file
    fileName = `${timestamp}_${name}_down.sql`;
    filePath = path.join(this.migrationsDir, fileName);
    fs.writeFileSync(filePath, '-- down SQL here');

    console.log(`Successfully created migration files: ${timestamp}_${name}`);
  }

  async down(): Promise<void> {
    await this.migrate('down');
    console.log('Migrations down completed successfully.');
  }

  async go(version: number): Promise<void> {
    try {
      await this.acquireLock();
      await this.migrationTableInit();
      const currentVersion = await this.getCurrentVersion();
      if (currentVersion === version) {
        console.log(`Already at version ${version}`);
        return;
      }
      const direction: Direction = version > currentVersion ? 'up' : 'down';
      const migrationFiles = getMigrationFiles(this.migrationsDir, direction);
      await this.dbClient.begin(async tx => {
        if (direction === 'up') {
          const n = Math.min(migrationFiles.length, version);
          for (let i = currentVersion; i < n; i++) {
            const file = migrationFiles[i] ?? '';
            const filePath = path.join(this.migrationsDir, file);
            await tx` INSERT INTO migrations(name, version) VALUES (${file}, ${i} + 1) ON CONFLICT (name) DO NOTHING;`;
            await tx.file(filePath).execute();
            console.log(`Successfully migrated: ${file}`);
          }
          if (version > migrationFiles.length) {
            console.log(`Currently at latest version: ${currentVersion}`);
          }
        } else {
          // get index of the current file
          const start = migrationFiles.length - currentVersion;
          // current index + number of file to down
          const end = start + (currentVersion - version);
          for (let i = start; i < end; i++) {
            const file = migrationFiles[i] ?? '';
            const filePath = path.join(this.migrationsDir, file);
            await tx` DELETE FROM migrations WHERE version = ${migrationFiles.length - i};`;
            await tx.file(filePath).execute();
            console.log(`Successfully migrated: ${file}`);
          }
        }
      });
    } finally {
      await this.releaseLock();
    }
  }

  async up(): Promise<void> {
    await this.migrate('up');
    console.log('Migrations up completed successfully.');
  }

  async getCurrentVersion(): Promise<number> {
    const result = await this
      .dbClient`SELECT version FROM migrations ORDER BY version DESC LIMIT 1;`;
    return result.length > 0 ? (result[0]?.['version'] as number) : 0;
  }

  async migrate(direction: Direction): Promise<void> {
    try {
      await this.acquireLock();
      await this.migrationTableInit();
      const currentVersion = await this.getCurrentVersion();
      const migrationFiles = getMigrationFiles(this.migrationsDir, direction);
      await this.dbClient.begin(async tx => {
        // migrate up
        if (direction === 'up') {
          for (const file of migrationFiles) {
            const id = migrationFiles.indexOf(file);
            if (id >= currentVersion) {
              const filePath = path.join(this.migrationsDir, file);
              await tx` INSERT INTO migrations(name, version) VALUES (${file}, ${id} + 1) ON CONFLICT (name) DO NOTHING;`;
              await tx.file(filePath).execute();
              console.log(`Successfully migrated: ${file}`);
            }
          }
        } else {
          // migrate down
          for (const file of migrationFiles) {
            const id = migrationFiles.indexOf(file);
            if (id < currentVersion) {
              const filePath = path.join(this.migrationsDir, file);
              await tx` DELETE FROM migrations WHERE version = ${id} + 1;`;
              await tx.file(filePath).execute();
              console.log(`Successfully migrated: ${file}`);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error during migrations:', error);
    } finally {
      await this.releaseLock();
    }
  }

  async acquireLock(): Promise<void> {
    await this.dbClient`SELECT pg_advisory_lock(21421431414441411)`;
  }

  async releaseLock(): Promise<void> {
    await this.dbClient`SELECT pg_advisory_unlock(21421431414441411)`;
  }
}

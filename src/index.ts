import path from 'node:path';

import { ReservedSql, Sql } from 'postgres';

import { Direction, getMigrationFiles } from '@/utils';

export interface IMigrator {
  up: () => Promise<void>;
  down: () => Promise<void>;
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

  async ensureMigrationTable(tx: ReservedSql): Promise<void> {
    await tx`CREATE TABLE IF NOT EXISTS migrations(
                        name varchar(500) PRIMARY KEY,
                        version smallint NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
  }

  async up(): Promise<void> {
    try {
      await this.migrate('up');
      console.log('Migrations up completed successfully.');
    } catch (error) {
      console.error('Error during migrations up:', error);
    }
  }

  async down(): Promise<void> {
    try {
      await this.migrate('down');
      console.log('Migrations down completed successfully.');
    } catch (error) {
      console.error('Error during migrations down:', error);
    }
  }

  async go(version: number): Promise<void> {
    const tx = await this.dbClient.reserve();
    try {
      await this.acquireLock(tx);
      await tx`BEGIN`;
      await this.ensureMigrationTable(tx);
      const currentVersion = await this.getCurrentVersionWithTx(tx);
      if (currentVersion === version) {
        console.log(`Already at version ${version}`);
        return;
      }
      const direction: Direction = version > currentVersion ? 'up' : 'down';
      const fileNames = getMigrationFiles(this.migrationsDir, direction);
      if (direction === 'up') {
        const fileVersion = Math.min(fileNames.length, version);
        for (let i = currentVersion; i < fileVersion; i++) {
          const file = fileNames[i] ?? '';
          await Promise.all([
            tx.file(path.join(this.migrationsDir, file)).execute(),
            tx`INSERT INTO migrations(name, version) VALUES (${file}, ${i} + 1)`
          ]);
          console.log(`Successfully migrated: ${file}`);
        }
        if (version > fileNames.length) {
          console.log(`Currently at latest version: ${currentVersion}`);
        }
      } else {
        // get index of the current file
        const start = fileNames.length - currentVersion;
        // current index + number of file to down
        const end = start + (currentVersion - version);
        for (let i = start; i < end; i++) {
          const file = fileNames[i] ?? '';
          await Promise.all([
            tx.file(path.join(this.migrationsDir, file)).execute(),
            tx`DELETE FROM migrations WHERE version = ${fileNames.length - i}`
          ]);
          console.log(`Successfully migrated: ${file}`);
        }
      }
      await tx`COMMIT`;
    } catch (error) {
      await tx`ROLLBACK`;
      console.error('Error during migrations:', error);
    } finally {
      await this.releaseLock(tx);
      tx.release();
    }
  }

  async migrate(direction: Direction): Promise<void> {
    const tx = await this.dbClient.reserve();
    try {
      await this.acquireLock(tx);
      await tx`BEGIN`;
      await this.ensureMigrationTable(tx);
      const currentVersion = await this.getCurrentVersionWithTx(tx);
      const fileNames = getMigrationFiles(this.migrationsDir, direction);
      if (direction === 'up') {
        for (const fileName of fileNames) {
          const id = fileNames.indexOf(fileName);
          if (id >= currentVersion) {
            await Promise.all([
              tx.file(path.join(this.migrationsDir, fileName)).execute(),
              tx`INSERT INTO migrations(name, version) VALUES (${fileName}, ${id} + 1)`
            ]);
            console.log(`Successfully migrated: ${fileName}`);
          }
        }
      } else {
        for (const fileName of fileNames) {
          const id = fileNames.indexOf(fileName);
          if (id < currentVersion) {
            await Promise.all([
              tx.file(path.join(this.migrationsDir, fileName)).execute(),
              tx`DELETE FROM migrations WHERE version = ${id} + 1`
            ]);
            console.log(`Successfully migrated: ${fileName}`);
          }
        }
      }
      await tx`COMMIT`;
    } catch (error) {
      await tx`ROLLBACK`;
      console.error('Error during migrations:', error);
    } finally {
      await this.releaseLock(tx);
      tx.release();
    }
  }

  async getCurrentVersion(): Promise<number> {
    const result = await this
      .dbClient`SELECT version FROM migrations ORDER BY version DESC LIMIT 1`;
    return result.length > 0 ? (result[0]?.['version'] as number) : 0;
  }

  async getCurrentVersionWithTx(tx: ReservedSql): Promise<number> {
    const result =
      await tx`SELECT version FROM migrations ORDER BY version DESC LIMIT 1`;
    return result.length > 0 ? (result[0]?.['version'] as number) : 0;
  }

  async acquireLock(tx: ReservedSql): Promise<void> {
    await tx`SELECT pg_advisory_lock(21421431414441411)`;
  }

  async releaseLock(tx: ReservedSql): Promise<void> {
    await tx`SELECT pg_advisory_unlock(21421431414441411)`;
  }
}

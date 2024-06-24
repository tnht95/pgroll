import path from 'node:path';

import { ReservedSql, Sql } from 'postgres';

import { Direction, getMigrationFiles } from '@/utils';

interface Option {
  eventHandler: (info: string) => void;
}

export interface IMigrator {
  migrationsDir: string;
  up: (opts?: Option) => Promise<void>;
  down: (opts?: Option) => Promise<void>;
  go: (version: number, opts?: Option) => Promise<void>;
  getCurrentVersion: () => Promise<number>;
}

export class Migrator implements IMigrator {
  private readonly dbClient: Sql;
  readonly migrationsDir: string;

  constructor(dbClient: Sql, migrationsDir = '') {
    this.dbClient = dbClient;
    this.migrationsDir = migrationsDir || `${process.cwd()}/migrations`;
  }

  async ensureMigrationTable(tx: ReservedSql): Promise<void> {
    await tx`CREATE TABLE IF NOT EXISTS migrations(
                        name varchar(500) PRIMARY KEY,
                        version smallint NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
  }

  async up(): Promise<void> {
    return this.migrate('up');
  }

  async down(): Promise<void> {
    return this.migrate('down');
  }

  async go(version: number, opts?: Option): Promise<void> {
    const tx = await this.dbClient.reserve();
    try {
      await this.acquireLock(tx);
      await this.begin(tx);
      await this.ensureMigrationTable(tx);
      const currentVersion = await this.getCurrentVersionWithTx(tx);
      if (currentVersion === version) {
        opts?.eventHandler(`Already at version ${version}`);
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
          opts?.eventHandler(`Successfully migrated: ${file}`);
        }
        if (version > fileNames.length) {
          opts?.eventHandler(`Currently at latest version: ${currentVersion}`);
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
          opts?.eventHandler(`Successfully migrated: ${file}`);
        }
      }
      await this.commit(tx);
    } catch (error) {
      await this.rollback(tx);
      throw error;
    } finally {
      await this.releaseLock(tx);
      tx.release();
    }
  }

  async migrate(direction: Direction, opts?: Option): Promise<void> {
    const tx = await this.dbClient.reserve();
    try {
      await this.acquireLock(tx);
      await this.begin(tx);
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
            opts?.eventHandler(`Successfully migrated: ${fileName}`);
          }
        }
      } else {
        // calculate start to know where the down migration starts
        const start = fileNames.length - currentVersion;
        for (let i = start; i < fileNames.length; i++) {
          const file = fileNames[i] ?? '';
          await Promise.all([
            tx.file(path.join(this.migrationsDir, file)).execute(),
            tx`DELETE FROM migrations WHERE version = ${fileNames.length - i}`
          ]);
          opts?.eventHandler(`Successfully migrated: ${file}`);
        }
      }
      await this.commit(tx);
    } catch (error) {
      await this.rollback(tx);
      throw error;
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

  async begin(tx: ReservedSql): Promise<void> {
    await tx`BEGIN`;
  }

  async commit(tx: ReservedSql): Promise<void> {
    await tx`COMMIT`;
  }

  async rollback(tx: ReservedSql): Promise<void> {
    await tx`ROLLBACK`;
  }
}

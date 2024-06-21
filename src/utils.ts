import fs from 'node:fs';
import path from 'node:path';

export type Direction = 'up' | 'down';

export const getMigrationFiles = (
  dir: string,
  direction: Direction
): string[] => {
  const files = fs
    .readdirSync(dir)
    .filter(file => file.endsWith(`_${direction}.sql`));
  if (direction == 'up') {
    return files.sort();
  }
  return files.sort((a, b) => b.localeCompare(a));
};

export const createFolderIfNotExists = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
};

export const createFile = (migrationDir: string, name: string): string[] => {
  createFolderIfNotExists(migrationDir);
  const timestamp = new Date().toISOString().replaceAll(/[.:TZ-]/g, '');

  const ressult = [];

  // make up file
  let fileName = `${timestamp}_${name}_up.sql`;
  let filePath = path.join(migrationDir, fileName);
  fs.writeFileSync(filePath, '-- up SQL here');
  ressult.push(filePath);

  // make down file
  fileName = `${timestamp}_${name}_down.sql`;
  filePath = path.join(migrationDir, fileName);
  fs.writeFileSync(filePath, '-- down SQL here');
  ressult.push(filePath);

  return ressult;
};

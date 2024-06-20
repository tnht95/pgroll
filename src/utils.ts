import fs from 'node:fs';

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

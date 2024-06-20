import fs from 'node:fs';

export type Direction = 'up' | 'down';

export const getMigrationFiles = (
  dir: string,
  direction: Direction
): string[] => {
  const pattern = new RegExp(`^.*_${direction}.sql$`);
  const files = fs.readdirSync(dir).filter(file => pattern.test(file));

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

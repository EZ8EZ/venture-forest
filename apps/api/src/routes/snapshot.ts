import { Hono } from 'hono';
import { readFileSync } from 'fs';
import { join } from 'path';

export const snapshotRoute = new Hono();

snapshotRoute.get('/', (c) => {
  try {
    const snapshotPath = join(process.cwd(), '..', '..', 'data', 'snapshots', 'latest.json');
    const data = readFileSync(snapshotPath, 'utf-8');
    return c.json(JSON.parse(data));
  } catch {
    return c.json({ error: 'No snapshot available. Run the data pipeline first.' }, 404);
  }
});

import { Hono } from 'hono';

export const investorsRoute = new Hono();

investorsRoute.get('/', (c) => {
  return c.json({ message: 'Investors endpoint. Connect to database for live data.' });
});

import { Hono } from 'hono';

export const companiesRoute = new Hono();

companiesRoute.get('/', (c) => {
  return c.json({ message: 'Companies endpoint. Connect to database for live data.' });
});

companiesRoute.get('/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ message: `Company ${id}. Connect to database for live data.` });
});

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { companiesRoute } from './routes/companies';
import { investorsRoute } from './routes/investors';
import { snapshotRoute } from './routes/snapshot';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({
    name: 'Venture Forest API',
    version: '0.1.0',
    status: 'running',
  });
});

app.route('/api/companies', companiesRoute);
app.route('/api/investors', investorsRoute);
app.route('/api/snapshot', snapshotRoute);

const port = Number(process.env.PORT) || 3001;

console.log(`Venture Forest API running on port ${port}`);

serve({ fetch: app.fetch, port });

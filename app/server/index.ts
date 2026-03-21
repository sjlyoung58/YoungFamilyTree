import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Check database exists
const dbPath = path.resolve(import.meta.dirname, '../data/family.db');
if (!fs.existsSync(dbPath)) {
  console.error('Database not found at', dbPath);
  console.error('Run "npm run migrate" first to extract data from RootsMagic.');
  process.exit(1);
}

app.use('/api', routes);

// In production, serve the built frontend
const distPath = path.resolve(import.meta.dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Young Family Tree API running on http://localhost:${PORT}`);
});

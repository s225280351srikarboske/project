import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import customerRoutes from './src/routes/customers.js';
import propertyRoutes from './src/routes/propertyRoutes.js';
import addTenantRoutes from './src/routes/addTenantRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import issueRoutes from './src/routes/issueRoutes.js';


dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static
app.use(express.static(path.join(__dirname, 'public')));

// db
await connectDB();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/addtenants', addTenantRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/issues', issueRoutes);


// default pages (static HTML)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/customer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tenant.html')));
app.get('/properties', (req, res) => res.sendFile(path.join(__dirname, 'public', 'properties.html')));
app.get('/tenants', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tenants.html')));
app.get('/addtenant', (req, res) => res.sendFile(path.join(__dirname, 'public', 'addtenant.html')));
app.get('/tenant-dashboard', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'tenantdashboard.html'))
);
// property details + chat (dynamic page uses same HTML file)
app.get('/tenant/property/:id', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'tenant-property.html'))
);

// tenant issues page
app.get('/tenant-issues', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'tenant-issues.html'))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
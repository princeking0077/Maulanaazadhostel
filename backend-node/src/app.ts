import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app: Application = express();

import path from 'path';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier frontend integration (optional, or configure stricter)
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files (React App)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/api/status', (req: Request, res: Response) => {
    res.json({ message: 'Hostel Management API Node.js Backend is running' });
});

// React Routing (Catch All)
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

export default app;

import { Router, Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Helper to generate token
const generateToken = (user: any) => {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
    );
};

// Login
router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register (Admin only - initial setup might need open register or seed script)
router.post('/register', async (req: Request, res: Response) => {
    const { username, password, role, name, email } = req.body;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, role || 'Staff', name, email]
        );

        res.status(201).json({ success: true, id: result.insertId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

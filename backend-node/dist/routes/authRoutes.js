"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Helper to generate token
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '24h' });
};
// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Register (Admin only - initial setup might need open register or seed script)
router.post('/register', async (req, res) => {
    const { username, password, role, name, email } = req.body;
    try {
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const [result] = await database_1.default.query('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, role || 'Staff', name, email]);
        res.status(201).json({ success: true, id: result.insertId });
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;

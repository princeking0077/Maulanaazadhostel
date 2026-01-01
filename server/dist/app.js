"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const api_1 = __importDefault(require("./routes/api"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const app = (0, express_1.default)();
const path_1 = __importDefault(require("path"));
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for easier frontend integration (optional, or configure stricter)
}));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve Static Files (React App)
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// API Routes
app.use('/api', api_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/students', studentRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
// Health Check
app.get('/api/status', (req, res) => {
    res.json({ message: 'Hostel Management API Node.js Backend is running' });
});
// React Routing (Catch All)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
exports.default = app;

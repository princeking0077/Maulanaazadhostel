"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
router.get('/status', async (req, res) => {
    try {
        const connection = await database_1.default.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'OK', database: 'Connected' });
    }
    catch (error) {
        res.status(500).json({ status: 'Error', database: error.message });
    }
});
exports.default = router;

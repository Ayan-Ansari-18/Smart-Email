"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./auth");
require("./auth"); // Load passport config
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: Boolean(true)
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
const emailRoutes_1 = __importDefault(require("./routes/emailRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const billRoutes_1 = __importDefault(require("./routes/billRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const draftRoutes_1 = __importDefault(require("./routes/draftRoutes"));
const middleware_1 = require("./middleware");
require("./workers/emailWorker"); // Initialize BullMQ worker
require("./workers/reminderWorker"); // Initialize Reminder BullMQ worker
require("./workers/summaryWorker"); // Initialize Summary BullMQ cron job
app.use('/api/emails', middleware_1.authenticateJWT, emailRoutes_1.default);
app.use('/api/tasks', middleware_1.authenticateJWT, taskRoutes_1.default);
app.use('/api/events', middleware_1.authenticateJWT, eventRoutes_1.default);
app.use('/api/bills', middleware_1.authenticateJWT, billRoutes_1.default);
app.use('/api/stats', middleware_1.authenticateJWT, statsRoutes_1.default);
app.use('/api/drafts', middleware_1.authenticateJWT, draftRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// OAuth Routes
app.get('/api/auth/google', passport_1.default.authenticate('google', {
    accessType: 'offline',
    prompt: 'consent'
}));
app.get('/api/auth/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }), (req, res) => {
    const user = req.user;
    const token = (0, auth_1.generateToken)(user.id);
    // Redirect to frontend to save token in localStorage
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
});
// Auth check route for frontend
app.get('/api/auth/me', middleware_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { prisma } = await Promise.resolve().then(() => __importStar(require('./db')));
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, picture: true }
        });
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: dbUser });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Logout route
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('jwt_token');
    res.json({ success: true });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

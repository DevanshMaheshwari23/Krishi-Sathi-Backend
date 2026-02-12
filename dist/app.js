"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const listingRoutes_1 = __importDefault(require("./routes/listingRoutes"));
const app = (0, express_1.default)();
// CORS - MUST be first, before any other middleware
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // Handle preflight
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    next();
});
// Other middleware
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// Routes
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/users", userRoutes_1.default);
app.use("/api/v1/listings", listingRoutes_1.default);
// 404
app.use((_req, res) => {
    res.status(404).json({ message: "Not found" });
});
exports.default = app;

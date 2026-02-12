"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 5000;
async function start() {
    await (0, database_1.connectDB)();
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
});

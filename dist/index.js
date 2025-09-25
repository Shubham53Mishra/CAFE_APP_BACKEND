"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const vendor_1 = __importDefault(require("./routes/vendor"));
const cafe_1 = __importDefault(require("./routes/cafe"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// MongoDB connection
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((err) => {
    console.error('Database connection error:', err);
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/vendor', vendor_1.default);
app.use('/api/cafe', cafe_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

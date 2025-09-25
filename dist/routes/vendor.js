"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Vendor_1 = __importDefault(require("../models/Vendor"));
const router = express_1.default.Router();
// Vendor Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { fullname, email, mobile, password } = req.body;
        const existingVendor = await Vendor_1.default.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const vendor = new Vendor_1.default({ fullname, email, mobile, password: hashedPassword });
        await vendor.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: vendor._id, email: vendor.email, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ message: 'Vendor registered successfully', token });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering vendor', error });
    }
});
// Vendor Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const vendor = await Vendor_1.default.findOne({ email });
        if (!vendor) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt_1.default.compare(password, vendor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: vendor._id, email: vendor.email, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            message: 'Login successful',
            vendor: { fullname: vendor.fullname, email: vendor.email, mobile: vendor.mobile },
            token
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Cafe_1 = __importDefault(require("../models/Cafe"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const router = express_1.default.Router();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        return {
            folder: 'cafe_images',
            resource_type: 'auto',
        };
    },
});
const upload = (0, multer_1.default)({ storage });
const Item = require('../models/Item').default;
// Add item to a cafe (vendor only, image upload)
router.post('/item', verifyVendorToken, upload.single('image'), async (req, res) => {
    try {
        const { name, price, cafeId } = req.body;
        const vendorEmail = req.vendor.email;
        if (!name || !price || !cafeId || !req.file) {
            return res.status(400).json({ message: 'All fields are required: name, price, cafeId, image.' });
        }
        // Check if cafe belongs to this vendor
        const cafe = await Cafe_1.default.findOne({ _id: cafeId, vendorEmail });
        if (!cafe) {
            return res.status(403).json({ message: 'You can only add items to your own cafes.' });
        }
        // Image URL from Cloudinary
        const imageUrl = req.file.path;
        const item = new Item({ name, price, image: imageUrl, cafeId, vendorEmail });
        await item.save();
        res.status(201).json({ message: 'Item added successfully', item });
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding item', error });
    }
});
// Middleware to verify vendor token
function verifyVendorToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'No token provided' });
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: 'Invalid token' });
        req.vendor = user;
        next();
    });
}
// Register a new cafe (with image upload, only for logged-in vendor)
router.post('/register', verifyVendorToken, upload.fields([
    { name: 'thumbnailImage', maxCount: 1 },
    { name: 'cafeImages', maxCount: 3 },
]), async (req, res) => {
    try {
        const { cafename, vendorPhone, cafeAddress } = req.body;
        const vendorEmail = req.vendor.email;
        // Validate
        const cafeImagesFiles = req.files['cafeImages'];
        if (!cafename || !vendorPhone || !cafeAddress || !req.files['thumbnailImage'] || !cafeImagesFiles || cafeImagesFiles.length < 1 || cafeImagesFiles.length > 3) {
            return res.status(400).json({ message: 'All fields are required. You must upload 1 thumbnailImage and at least 1 (max 3) cafeImages.' });
        }
        // Check for duplicate cafe for this vendor
        const existingCafe = await Cafe_1.default.findOne({ cafename, vendorEmail });
        if (existingCafe) {
            return res.status(409).json({ message: 'Cafe with this name already registered for this vendor.' });
        }
        // Get URLs from cloudinary upload
        const thumbnailImageUrl = req.files['thumbnailImage'][0].path;
        const cafeImages = cafeImagesFiles.map((file) => file.path);
        const cafe = new Cafe_1.default({ cafename, vendorEmail, vendorPhone, cafeAddress, thumbnailImage: thumbnailImageUrl, cafeImages });
        await cafe.save();
        res.status(201).json({
            message: 'Cafe registered successfully',
            cafe,
            imageUrls: cafe.cafeImages,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering cafe', error });
    }
});
// Get all cafes for the logged-in vendor (also available at /register for GET)
router.get('/register', verifyVendorToken, async (req, res) => {
    try {
        const vendorEmail = req.vendor.email;
        const cafes = await Cafe_1.default.find({ vendorEmail });
        res.status(200).json({ cafes });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching cafes', error });
    }
});
exports.default = router;

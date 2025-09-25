// ...existing code...
// All imports and router declaration above
// ...existing code...

// Get items: if vendor token present, show only vendor's items; else show all
// Place this route after all imports and router declaration
import express, { Request } from 'express';
import Cafe from '../models/Cafe';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    return {
      folder: 'cafe_images',
      resource_type: 'auto',
    };
  },
});
const upload = multer({ storage });

const Item = require('../models/Item').default;

// Extend Express Request to include vendor
interface VendorRequest extends Request {
  vendor?: any;
}

// Add item to a cafe (vendor only, image upload)
router.post('/item', verifyVendorToken, upload.single('image'), async (req: any, res) => {
  try {
    let { name, price, cafeId } = req.body;
    const vendorEmail = req.vendor.email;
    if (!name || !price || !cafeId || !req.file) {
      return res.status(400).json({ message: 'All fields are required: name, price, cafeId, image.' });
    }
    cafeId = cafeId.trim();
    // Check if cafe belongs to this vendor
    const cafe = await Cafe.findOne({ _id: cafeId, vendorEmail });
    if (!cafe) {
      return res.status(403).json({ message: 'You can only add items to your own cafes.' });
    }
    // Image URL from Cloudinary
    const imageUrl = req.file.path;
    const item = new Item({ name, price, image: imageUrl, cafeId, vendorEmail });
    await item.save();
    res.status(201).json({ message: 'Item added successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Error adding item', error });
  }
});

// Middleware to verify vendor token
function verifyVendorToken(req: VendorRequest, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.vendor = user;
    next();
  });
}

// Register a new cafe (with image upload, only for logged-in vendor)
router.post('/register', verifyVendorToken, upload.fields([
  { name: 'thumbnailImage', maxCount: 1 },
  { name: 'cafeImages', maxCount: 3 },
]), async (req: any, res) => {
  try {
    const { cafename, vendorPhone, cafeAddress } = req.body;
    const vendorEmail = req.vendor.email;
    // Validate
    const cafeImagesFiles = req.files['cafeImages'];
    if (!cafename || !vendorPhone || !cafeAddress || !req.files['thumbnailImage'] || !cafeImagesFiles || cafeImagesFiles.length < 1 || cafeImagesFiles.length > 3) {
      return res.status(400).json({ message: 'All fields are required. You must upload 1 thumbnailImage and at least 1 (max 3) cafeImages.' });
    }
    // Check for duplicate cafe for this vendor
    const existingCafe = await Cafe.findOne({ cafename, vendorEmail });
    if (existingCafe) {
      return res.status(409).json({ message: 'Cafe with this name already registered for this vendor.' });
    }
    // Get URLs from cloudinary upload
    const thumbnailImageUrl = req.files['thumbnailImage'][0].path;
    const cafeImages = cafeImagesFiles.map((file: any) => file.path);
    const cafe = new Cafe({ cafename, vendorEmail, vendorPhone, cafeAddress, thumbnailImage: thumbnailImageUrl, cafeImages });
    await cafe.save();
    res.status(201).json({
      message: 'Cafe registered successfully',
      cafe,
      imageUrls: cafe.cafeImages,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering cafe', error });
  }
});

// Get all cafes for the logged-in vendor (also available at /register for GET)
router.get('/register', verifyVendorToken, async (req: VendorRequest, res) => {
  try {
    const vendorEmail = req.vendor.email;
    const cafes = await Cafe.find({ vendorEmail });
    res.status(200).json({ cafes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cafes', error });
  }
});

// Get items: if vendor token present, show only vendor's items; else show all
router.get('/item', async (req: any, res) => {
  try {
    let items;
    // Check for Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const vendor = jwt.verify(token, process.env.JWT_SECRET as string);
        items = await Item.find({ vendorEmail: (vendor as any).email });
      } catch (err) {
        // Invalid token, show all items
        items = await Item.find();
      }
    } else {
      // No token, show all items
      items = await Item.find();
    }
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error });
  }
});

export default router;

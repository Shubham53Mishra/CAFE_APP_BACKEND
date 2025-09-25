import express, { Request } from 'express';
import Cafe from '../models/Cafe';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// Cloudinary config (make sure your .env has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
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

const router = express.Router();

// Extend Express Request to include vendor
interface VendorRequest extends Request {
  vendor?: any;
}

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
    const { cafename, vendorPhone, cafeAddress, fromDates } = req.body;
    const vendorEmail = req.vendor.email;
    // fromDates should be a comma-separated string or array
    let fromDateArr: string[] = [];
    if (Array.isArray(fromDates)) {
      fromDateArr = fromDates;
    } else if (typeof fromDates === 'string') {
      fromDateArr = fromDates.split(',').map((d: string) => d.trim());
    }
    // Validate
    if (!cafename || !vendorPhone || !cafeAddress || !req.files['thumbnailImage'] || !req.files['cafeImages'] || req.files['cafeImages'].length !== 3 || fromDateArr.length !== 3) {
      return res.status(400).json({ message: 'All fields are required. You must upload 1 thumbnailImage, 3 cafeImages, and provide 3 fromDates.' });
    }
    // Get URLs from cloudinary upload
    const thumbnailImageUrl = req.files['thumbnailImage'][0].path;
    const cafeImages = req.files['cafeImages'].map((file: any, idx: number) => ({ url: file.path, fromDate: new Date(fromDateArr[idx]) }));
    const cafe = new Cafe({ cafename, vendorEmail, vendorPhone, cafeAddress, thumbnailImage: thumbnailImageUrl, cafeImages });
    await cafe.save();
    res.status(201).json({
      message: 'Cafe registered successfully',
      cafe,
      imageUrls: cafe.cafeImages.map((img: any) => img.url),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering cafe', error });
  }
});

// Get all cafes for the logged-in vendor
router.get('/mycafes', verifyVendorToken, async (req: VendorRequest, res) => {
  try {
    const vendorEmail = req.vendor.email;
    const cafes = await Cafe.find({ vendorEmail });
    res.status(200).json({ cafes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cafes', error });
  }
});

export default router;

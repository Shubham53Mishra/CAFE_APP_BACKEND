import express, { Request } from 'express';
import Cafe from '../models/Cafe';
import jwt from 'jsonwebtoken';

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

// Register a new cafe (only for logged-in vendor)
router.post('/register', verifyVendorToken, async (req: VendorRequest, res) => {
  try {
    const { cafename, vendorPhone, cafeAddress, thumbnailImage, cafeImages } = req.body;
    const vendorEmail = req.vendor.email;
    if (!cafename || !vendorPhone || !cafeAddress || !thumbnailImage || !cafeImages || !Array.isArray(cafeImages) || cafeImages.length !== 3) {
      return res.status(400).json({ message: 'All fields are required and cafeImages must be an array of 3 images.' });
    }
    const cafe = new Cafe({ cafename, vendorEmail, vendorPhone, cafeAddress, thumbnailImage, cafeImages });
    await cafe.save();
    res.status(201).json({ message: 'Cafe registered successfully', cafe });
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

import express from 'express';
import bcrypt from 'bcrypt';
import Vendor, { IVendor } from '../models/Vendor';

const router = express.Router();

// Vendor Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, mobile, password } = req.body;
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = new Vendor({ fullname, email, mobile, password: hashedPassword });
    await vendor.save();
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering vendor', error });
  }
});

// Vendor Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    res.status(200).json({ message: 'Login successful', vendor: { fullname: vendor.fullname, email: vendor.email, mobile: vendor.mobile } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

export default router;

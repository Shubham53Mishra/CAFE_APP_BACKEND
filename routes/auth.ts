import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profileImages'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Get user profile by token
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
});

// Update user profile image
router.put('/profile', upload.single('profileImage'), async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    user.profileImage = `/uploads/profileImages/${req.file.filename}`;
    await user.save();
    res.status(200).json({ message: 'Profile image updated', profileImage: user.profileImage });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile image', error });
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { fullname, email, mobile, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullname, email, mobile, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    res.status(200).json({
      message: 'Login successful',
      user: { fullname: user.fullname, email: user.email, mobile: user.mobile },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

export default router;

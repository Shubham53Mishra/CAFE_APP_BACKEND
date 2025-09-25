import express from 'express';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';

const router = express.Router();

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
    res.status(200).json({ message: 'Login successful', user: { fullname: user.fullname, email: user.email, mobile: user.mobile } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

export default router;

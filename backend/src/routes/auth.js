import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '../services/email.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    // Generate OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save OTP to database
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt
      }
    });
    
    // Send email
    await sendOtpEmail(email, code);
    
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login/signup
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code required' });
    }
    
    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordless: true
        }
      });
    }
    
    // Delete used OTP
    await prisma.otpCode.delete({
      where: { id: otpRecord.id }
    });
    
    // Generate JWT
    const token = generateToken(user.id);
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        isGuest: user.isGuest
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Email/password signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordless: false, isGuest: false, passwordHash: hash } });
    const token = generateToken(user.id);
    return res.json({ success: true, token, user: { id: user.id, email: user.email, isGuest: user.isGuest } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to signup' });
  }
});

// Email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id);
    return res.json({ success: true, token, user: { id: user.id, email: user.email, isGuest: user.isGuest } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    // Create guest user
    const user = await prisma.user.create({
      data: {
        isGuest: true,
        passwordless: true
      }
    });
    
    // Generate JWT
    const token = generateToken(user.id);
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        email: null,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Failed to create guest account' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        socialAccounts: true
      }
    });
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
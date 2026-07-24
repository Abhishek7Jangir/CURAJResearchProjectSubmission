const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const AuthOtp = require('../models/AuthOtp');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required. Set it in your .env file.');
const OTP_VALIDITY_MINUTES = 10;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendOtpEmail(email, otp, subject) {
  const transporter = getMailer();
  if (!transporter) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend .env'
    );
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h3>${subject}</h3>
      <p>Your OTP is:</p>
      <p style="font-size: 22px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
      <p>This OTP expires in ${OTP_VALIDITY_MINUTES} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;
  await transporter.sendMail({
    from,
    to: email,
    subject,
    html
  });
}

async function issueOtp({ email, purpose, payload = null }) {
  const otp = createOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000);

  await AuthOtp.updateMany({ email, purpose, consumed: false }, { $set: { consumed: true } });
  await AuthOtp.create({ email, purpose, otpHash, expiresAt, payload });

  return otp;
}

// Designations that can only have ONE user across the entire system
const SINGLETON_DESIGNATIONS = [
  'r&d_helper',
  'r&d_main',
  'finance_officer_helper',
  'finance_officer_main',
  'academic_integrity_officer',
  'registrar',
  'vc_office',
  'vice_chancellor'
];

// Designations where only ONE user per department is allowed
const DEPARTMENT_SINGLETON_DESIGNATIONS = ['hod', 'dean'];

async function checkDesignationAvailability(designation, department) {
  if (SINGLETON_DESIGNATIONS.includes(designation)) {
    const existing = await User.findOne({ designation });
    if (existing) {
      const labelMap = {
        'r&d_helper': 'R&D Office',
        'r&d_main': 'R&D Officer',
        'finance_officer_helper': 'Finance Office',
        'finance_officer_main': 'Finance Officer',
        'academic_integrity_officer': 'Internal Audit Officer (IAO)',
        'registrar': 'Registrar',
        'vc_office': 'VC Office',
        'vice_chancellor': 'Vice Chancellor'
      };
      return `A user with designation "${labelMap[designation] || designation}" is already registered. Only one account is allowed for this role.`;
    }
  }
  if (DEPARTMENT_SINGLETON_DESIGNATIONS.includes(designation)) {
    if (!department || department === 'N/A') {
      return 'Department is required for HOD and Dean roles.';
    }
    const existing = await User.findOne({ designation, department });
    if (existing) {
      const label = designation === 'hod' ? 'HOD' : 'Dean';
      return `A ${label} for the department "${department}" is already registered. Only one ${label} per department is allowed.`;
    }
  }
  return null;
}

// Signup OTP request
router.post('/signup/request-otp', async (req, res) => {
  const { name, email, password, designation, department } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password || !designation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate institutional email domain
  if (!normalizedEmail.endsWith('.curaj.ac.in')) {
    return res.status(400).json({ error: 'Only institutional email addresses ending with .curaj.ac.in are allowed.' });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check designation uniqueness constraints
    const designationError = await checkDesignationAvailability(designation, department);
    if (designationError) {
      return res.status(400).json({ error: designationError });
    }

    const otp = await issueOtp({
      email: normalizedEmail,
      purpose: 'signup',
      payload: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        designation,
        department: department || 'N/A'
      }
    });

    await sendOtpEmail(normalizedEmail, otp, 'Verify your CURAJ Research signup');
    res.json({ message: 'OTP sent to email address' });
  } catch (error) {
    console.error('Signup request OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send signup OTP' });
  }
});

// Signup OTP verify and create user (no auto login)
router.post('/signup/verify-otp', async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  if (!normalizedEmail || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const record = await AuthOtp.findOne({
      email: normalizedEmail,
      purpose: 'signup',
      consumed: false
    }).sort({ createdAt: -1 });

    if (!record || record.expiresAt < new Date() || record.otpHash !== hashOtp(otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      record.consumed = true;
      await record.save();
      return res.status(400).json({ error: 'Email already exists' });
    }

    const payload = record.payload || {};
    if (!payload.name || !payload.passwordHash || !payload.designation) {
      return res.status(400).json({ error: 'Signup session invalid. Please request OTP again.' });
    }

    // Re-check designation uniqueness at account creation (prevent race conditions)
    const designationError = await checkDesignationAvailability(payload.designation, payload.department);
    if (designationError) {
      record.consumed = true;
      await record.save();
      return res.status(400).json({ error: designationError });
    }

    const user = new User({
      userName: payload.name,
      email: normalizedEmail,
      password: payload.passwordHash,
      designation: payload.designation,
      department: payload.department || 'N/A',
      profilePic: ''
    });
    await user.save();
    record.consumed = true;
    await record.save();

    res.status(201).json({ message: 'Registration complete. Please sign in.' });
  } catch (error) {
    console.error('Signup verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify signup OTP' });
  }
});

// Forgot-password OTP request
router.post('/forgot-password/request-otp', async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const otp = await issueOtp({
      email: normalizedEmail,
      purpose: 'forgot_password'
    });
    await sendOtpEmail(normalizedEmail, otp, 'CURAJ password reset OTP');
    res.json({ message: 'OTP sent to email address' });
  } catch (error) {
    console.error('Forgot request OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send forgot-password OTP' });
  }
});

// Forgot-password OTP verify
router.post('/forgot-password/verify-otp', async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  if (!normalizedEmail || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const record = await AuthOtp.findOne({
      email: normalizedEmail,
      purpose: 'forgot_password',
      consumed: false
    }).sort({ createdAt: -1 });

    if (!record || record.expiresAt < new Date() || record.otpHash !== hashOtp(otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    record.meta = {
      resetTokenHash: hashResetToken(resetToken),
      resetTokenExpiresAt: new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000)
    };
    await record.save();

    res.json({ message: 'OTP verified', resetToken });
  } catch (error) {
    console.error('Forgot verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Forgot-password reset
router.post('/forgot-password/reset', async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!normalizedEmail || !resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const record = await AuthOtp.findOne({
      email: normalizedEmail,
      purpose: 'forgot_password',
      consumed: false
    }).sort({ createdAt: -1 });

    const expectedHash = hashResetToken(resetToken);
    const tokenMeta = record?.meta || {};
    if (
      !record ||
      !tokenMeta.resetTokenHash ||
      tokenMeta.resetTokenHash !== expectedHash ||
      !tokenMeta.resetTokenExpiresAt ||
      new Date(tokenMeta.resetTokenExpiresAt) < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset session' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found for this email' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    record.consumed = true;
    await record.save();

    res.json({ message: 'Password changed successfully. Please sign in.' });
  } catch (error) {
    console.error('Forgot reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = {
      id: user._id.toString(),
      name: user.userName,
      email: user.email,
      designation: user.designation,
      department: user.department
    };

    const token = jwt.sign({ id: userObj.id, email: userObj.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: userObj });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = {
      id: user._id.toString(),
      name: user.userName,
      email: user.email,
      designation: user.designation,
      department: user.department
    };

    res.json({ user: userObj });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
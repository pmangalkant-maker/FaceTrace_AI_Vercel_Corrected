import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  signToken,
  requireAuth,
  logAudit,
  createRateLimiter,
} from '../auth';

export const authRouter = Router();

const authRateLimiter = createRateLimiter(60_000, 15, 'Too many authentication attempts. Please try again in 1 minute.');

// Register
authRouter.post('/register', authRateLimiter, (req, res) => {
  try {
    const { email, password, full_name, organization, role, phone } = req.body;

    if (!email || !password || !full_name) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    // Role selection: default 'public', can request 'case_manager' or 'law_enforcement' (pending verification)
    const allowedRoles = ['public', 'case_manager', 'law_enforcement'];
    const assignedRole = allowedRoles.includes(role) ? role : 'public';
    const isVerified = assignedRole === 'public' ? 1 : 0; // public is auto-verified, specialized roles require admin review

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, full_name, role, organization, phone, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email.toLowerCase().trim(),
      hash,
      salt,
      full_name.trim(),
      assignedRole,
      organization?.trim() || null,
      phone?.trim() || null,
      isVerified
    );

    const userObj = {
      id: userId,
      email: email.toLowerCase().trim(),
      role: assignedRole as any,
      full_name: full_name.trim(),
      organization: organization?.trim() || undefined,
      is_verified: Boolean(isVerified),
    };

    const token = signToken(userObj);
    logAudit(req, 'USER_REGISTERED', 'user', userId, { role: assignedRole, organization });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: userObj,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// Login
authRouter.post('/login', authRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userRow = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase().trim()) as any;

    if (!userRow) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValid = verifyPassword(password, userRow.password_salt, userRow.password_hash);
    if (!isValid) {
      logAudit(req, 'AUTH_FAILED', 'user', userRow.id, { reason: 'Incorrect password' });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const userObj = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      full_name: userRow.full_name,
      organization: userRow.organization || undefined,
      is_verified: Boolean(userRow.is_verified),
    };

    const token = signToken(userObj);
    logAudit(req, 'USER_LOGIN', 'user', userRow.id);

    res.json({
      message: 'Signed in successfully.',
      token,
      user: userObj,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication service encountered an error.' });
  }
});

// Quick demo login for testing predefined roles
authRouter.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail = 'volunteer@facetrace.org';
    if (role === 'admin') targetEmail = 'admin@facetrace.org';
    else if (role === 'case_manager') targetEmail = 'coordinator@facetrace.org';

    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail) as any;
    if (!userRow) {
      res.status(404).json({ error: 'Demo user not initialized.' });
      return;
    }

    const userObj = {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role,
      full_name: userRow.full_name,
      organization: userRow.organization || undefined,
      is_verified: Boolean(userRow.is_verified),
    };

    const token = signToken(userObj);
    logAudit(req, 'DEMO_LOGIN', 'user', userRow.id, { demo_role: role });

    res.json({
      message: `Signed in as demo ${userRow.role}.`,
      token,
      user: userObj,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo sign-in failed.' });
  }
});

// Get current user profile
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Logout
authRouter.post('/logout', (req, res) => {
  if (req.user) {
    logAudit(req, 'USER_LOGOUT', 'user', req.user.id);
  }
  res.json({ message: 'Signed out.' });
});

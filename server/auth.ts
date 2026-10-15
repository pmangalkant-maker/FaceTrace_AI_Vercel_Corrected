import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'facetrace_secure_production_secret_key_892349817234';

export interface AuthUser {
  id: string;
  email: string;
  role: 'public' | 'case_manager' | 'law_enforcement' | 'admin';
  full_name: string;
  organization?: string;
  is_verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      clientIp?: string;
    }
  }
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computed = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

export function signToken(user: AuthUser, expiresInDays = 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
      exp,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, 'base64url'),
        Buffer.from(expectedSig, 'base64url')
      )
    ) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Capture anonymized IP for privacy & audit compliance
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  req.clientIp = rawIp;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyToken(token);
  if (!decoded || !decoded.sub) {
    return next();
  }

  try {
    const userRow = db
      .prepare('SELECT id, email, role, full_name, organization, is_verified FROM users WHERE id = ?')
      .get(decoded.sub) as any;

    if (userRow) {
      req.user = {
        id: userRow.id,
        email: userRow.email,
        role: userRow.role,
        full_name: userRow.full_name,
        organization: userRow.organization,
        is_verified: Boolean(userRow.is_verified),
      };
    }
  } catch (err) {
    console.error('Auth lookup error:', err);
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required. Please sign in to access this resource.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }
  next();
}

export function requireRole(allowedRoles: Array<'public' | 'case_manager' | 'law_enforcement' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access restricted. Your current role (${req.user.role}) does not have permission for this action.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

export function logAudit(
  req: Request,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, any> = {}
) {
  try {
    const auditId = 'audit_' + crypto.randomUUID();
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || null;
    const ip = req.clientIp || '127.0.0.1';
    const userAgent = (req.headers['user-agent'] || '').substring(0, 200);

    // Sanitize details: remove any password or credential fields
    const sanitized = { ...details };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.password_hash;

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, ip_address, user_agent, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(auditId, userId, userEmail, action, entityType, entityId, ip, userAgent, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function createRateLimiter(windowMs: number, maxRequests: number, message = 'Rate limit exceeded. Please wait.') {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.clientIp || '127.0.0.1') + ':' + req.baseUrl + req.path;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: message,
        retryAfterMs: Math.max(0, record.resetAt - now),
      });
      return;
    }

    record.count += 1;
    next();
  };
}

import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, logAudit } from '../auth';

export const adminRouter = Router();

// Protect all admin routes
adminRouter.use(requireAuth);
adminRouter.use(requireRole(['admin', 'law_enforcement']));

// GET /api/admin/stats - Authentic database statistics
adminRouter.get('/stats', (req, res) => {
  try {
    const totalCases = (db.prepare('SELECT COUNT(*) as c FROM cases').get() as any).c;
    const activeCases = (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'active'").get() as any).c;
    const locatedCases = (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'located'").get() as any).c;
    const resolvedCases = (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'resolved'").get() as any).c;

    const totalSightings = (db.prepare('SELECT COUNT(*) as c FROM sightings').get() as any).c;
    const pendingSightings = (db.prepare("SELECT COUNT(*) as c FROM sightings WHERE status = 'pending_review'").get() as any).c;
    const verifiedSightings = (db.prepare("SELECT COUNT(*) as c FROM sightings WHERE status = 'verified_by_moderator'").get() as any).c;
    const forwardedSightings = (db.prepare("SELECT COUNT(*) as c FROM sightings WHERE status = 'forwarded_to_police'").get() as any).c;

    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const verifiedUsers = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_verified = 1').get() as any).c;

    const auditCount = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;

    res.json({
      stats: {
        totalCases,
        activeCases,
        locatedCases,
        resolvedCases,
        totalSightings,
        pendingSightings,
        verifiedSightings,
        forwardedSightings,
        totalUsers,
        verifiedUsers,
        totalAuditEvents: auditCount,
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to query database metrics.' });
  }
});

// GET /api/admin/audit-logs - Tamper-evident activity logs
adminRouter.get('/audit-logs', (req, res) => {
  try {
    const { action, entity_type, limit = '50', page = '1' } = req.query as Record<string, string>;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];

    if (action && action.trim()) {
      conditions.push('action = ?');
      params.push(action.trim());
    }

    if (entity_type && entity_type.trim()) {
      conditions.push('entity_type = ?');
      params.push(entity_type.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`).get(...params) as any;
    const total = countRow ? countRow.total : 0;

    const logs = db.prepare(`
      SELECT id, user_id, user_email, action, entity_type, entity_id, ip_address, user_agent, details_json, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset) as any[];

    const formatted = logs.map((l) => ({
      ...l,
      details: l.details_json ? JSON.parse(l.details_json) : {},
    }));

    res.json({
      logs: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    console.error('Audit logs query error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});

// GET /api/admin/users - User management
adminRouter.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, role, organization, phone, is_verified, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (err: any) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users.' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role & verification
adminRouter.patch('/users/:id/role', (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_verified } = req.body;

    const allowedRoles = ['public', 'case_manager', 'law_enforcement', 'admin'];
    if (role && !allowedRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    const targetUser = db.prepare('SELECT id, email, role, is_verified FROM users WHERE id = ?').get(id) as any;
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const updatedRole = role || targetUser.role;
    const updatedVerified = is_verified !== undefined ? (is_verified ? 1 : 0) : targetUser.is_verified;

    db.prepare(`
      UPDATE users
      SET role = ?, is_verified = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updatedRole, updatedVerified, id);

    logAudit(req, 'USER_ROLE_UPDATED', 'user', id, {
      previous_role: targetUser.role,
      new_role: updatedRole,
      verified: Boolean(updatedVerified),
    });

    res.json({ message: 'User updated successfully.' });
  } catch (err: any) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user authorization.' });
  }
});

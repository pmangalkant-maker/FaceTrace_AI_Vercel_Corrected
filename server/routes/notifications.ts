import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../auth';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /api/notifications - User's notifications
notificationsRouter.get('/', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT id, title, message, link, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY is_read ASC, created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    const unreadCount = (db.prepare(`
      SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(req.user!.id) as any).c;

    res.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read - Mark one as read
notificationsRouter.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(id, req.user!.id);

    res.json({ message: 'Notification marked as read.' });
  } catch (err: any) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// POST /api/notifications/mark-all-read - Mark all as read
notificationsRouter.post('/mark-all-read', (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ?
    `).run(req.user!.id);

    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

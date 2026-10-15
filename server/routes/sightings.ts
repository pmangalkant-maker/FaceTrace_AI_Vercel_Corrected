import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { requireAuth, requireRole, logAudit, createRateLimiter } from '../auth';

export const sightingsRouter = Router();

const sightingRateLimiter = createRateLimiter(60_000, 10, 'Too many sighting reports submitted. Please wait a moment.');

// GET /api/cases/:id/sightings - Sightings attached to a case
sightingsRouter.get('/case/:caseId', (req, res) => {
  try {
    const { caseId } = req.params;
    const caseRecord = db.prepare('SELECT id, reporter_user_id FROM cases WHERE id = ?').get(caseId) as any;

    if (!caseRecord) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const isOwner = req.user && req.user.id === caseRecord.reporter_user_id;
    const isAuthority = req.user && ['admin', 'case_manager', 'law_enforcement'].includes(req.user.role);

    let query = `
      SELECT
        id, case_id, sighting_date, city, state, country, location_notes, description,
        photo_url, photo_analysis_json, status, moderator_notes, created_at
      FROM sightings
      WHERE case_id = ?
    `;

    // Public users only see verified sightings
    if (!isOwner && !isAuthority) {
      query += " AND status = 'verified_by_moderator'";
    }

    query += ' ORDER BY sighting_date DESC';

    const sightings = db.prepare(query).all(caseId) as any[];

    // Parse photo analysis if present
    const formatted = sightings.map((s) => ({
      ...s,
      photo_analysis: s.photo_analysis_json ? JSON.parse(s.photo_analysis_json) : null,
    }));

    res.json({ sightings: formatted });
  } catch (err: any) {
    console.error('Fetch sightings error:', err);
    res.status(500).json({ error: 'Failed to retrieve sightings.' });
  }
});

// POST /api/sightings - Report a new community sighting
sightingsRouter.post('/', sightingRateLimiter, (req, res) => {
  try {
    const {
      case_id,
      sighting_date,
      city,
      state,
      country,
      location_notes,
      description,
      photo_url,
      photo_analysis,
      submitter_name,
      submitter_contact,
      consent_accuracy,
    } = req.body;

    if (!case_id || !sighting_date || !city || !state || !country || !location_notes || !description) {
      res.status(400).json({
        error: 'Missing required sighting information: Date, Location, and Detailed Description are required.',
      });
      return;
    }

    if (!submitter_name || !submitter_contact) {
      res.status(400).json({
        error: 'Contact information is required so law enforcement and case coordinators can verify leads.',
      });
      return;
    }

    if (!consent_accuracy) {
      res.status(400).json({
        error: 'You must confirm that this sighting is reported in good faith based on your best recollection.',
      });
      return;
    }

    const caseRecord = db.prepare('SELECT id, case_number, full_name, reporter_user_id FROM cases WHERE id = ?').get(case_id) as any;
    if (!caseRecord) {
      res.status(404).json({ error: 'Referenced case does not exist.' });
      return;
    }

    const sightingId = 'sight_' + crypto.randomUUID();
    const submitterUserId = req.user?.id || null;

    db.prepare(`
      INSERT INTO sightings (
        id, case_id, sighting_date, city, state, country, location_notes, description,
        photo_url, photo_analysis_json, submitter_name, submitter_contact, submitter_user_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')
    `).run(
      sightingId,
      case_id,
      sighting_date,
      city.trim(),
      state.trim(),
      country.trim(),
      location_notes.trim(),
      description.trim(),
      photo_url || null,
      photo_analysis ? JSON.stringify(photo_analysis) : null,
      submitter_name.trim(),
      submitter_contact.trim(),
      submitterUserId
    );

    // Notify case owner if exists
    if (caseRecord.reporter_user_id) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link, type)
        VALUES (?, ?, ?, ?, ?, 'sighting_moderation')
      `).run(
        'notif_' + crypto.randomUUID(),
        caseRecord.reporter_user_id,
        'New Sighting Report Awaiting Review',
        `A new community sighting was reported for ${caseRecord.full_name} (${caseRecord.case_number}).`,
        `/cases/${caseRecord.id}`
      );
    }

    logAudit(req, 'SIGHTING_REPORTED', 'sighting', sightingId, {
      case_id,
      city,
      state,
      country,
    });

    res.status(201).json({
      message: 'Sighting reported successfully. Your report has entered the verified moderation queue.',
      sighting_id: sightingId,
      status: 'pending_review',
    });
  } catch (err: any) {
    console.error('Submit sighting error:', err);
    res.status(500).json({ error: 'Failed to record sighting.' });
  }
});

// GET /api/sightings/pending - Moderation queue (authority only)
sightingsRouter.get('/pending', requireAuth, requireRole(['admin', 'case_manager', 'law_enforcement']), (req, res) => {
  try {
    const query = `
      SELECT
        s.id, s.case_id, s.sighting_date, s.city, s.state, s.country, s.location_notes,
        s.description, s.photo_url, s.photo_analysis_json, s.submitter_name, s.submitter_contact,
        s.status, s.moderator_notes, s.created_at,
        c.full_name as case_full_name, c.case_number, c.police_case_number, c.primary_photo_url as case_photo_url
      FROM sightings s
      JOIN cases c ON s.case_id = c.id
      WHERE s.status = 'pending_review'
      ORDER BY s.created_at DESC
    `;

    const pending = db.prepare(query).all() as any[];
    const formatted = pending.map((p) => ({
      ...p,
      photo_analysis: p.photo_analysis_json ? JSON.parse(p.photo_analysis_json) : null,
    }));

    res.json({ sightings: formatted });
  } catch (err: any) {
    console.error('Fetch pending sightings error:', err);
    res.status(500).json({ error: 'Failed to retrieve moderation queue.' });
  }
});

// PATCH /api/sightings/:id/moderate - Moderate sighting
sightingsRouter.patch(
  '/:id/moderate',
  requireAuth,
  requireRole(['admin', 'case_manager', 'law_enforcement']),
  (req, res) => {
    try {
      const { id } = req.params;
      const { status, moderator_notes } = req.body;

      const validStatuses = ['verified_by_moderator', 'dismissed', 'forwarded_to_police'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid moderation action.' });
        return;
      }

      const existing = db.prepare('SELECT s.*, c.case_number FROM sightings s JOIN cases c ON s.case_id = c.id WHERE s.id = ?').get(id) as any;
      if (!existing) {
        res.status(404).json({ error: 'Sighting record not found.' });
        return;
      }

      db.prepare(`
        UPDATE sightings
        SET
          status = ?,
          moderator_notes = ?,
          reviewed_by_user_id = ?,
          reviewed_at = datetime('now')
        WHERE id = ?
      `).run(status, moderator_notes?.trim() || null, req.user!.id, id);

      // Notify submitter if they have an account
      if (existing.submitter_user_id) {
        let actionLabel = 'verified and published to the case page';
        if (status === 'forwarded_to_police') actionLabel = 'forwarded directly to investigating officers';
        else if (status === 'dismissed') actionLabel = 'reviewed and dismissed';

        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, link, type)
          VALUES (?, ?, ?, ?, ?, 'sighting_moderation')
        `).run(
          'notif_' + crypto.randomUUID(),
          existing.submitter_user_id,
          'Your Sighting Report Has Been Moderated',
          `Your sighting report for ${existing.case_number} was ${actionLabel}.`,
          `/cases/${existing.case_id}`
        );
      }

      logAudit(req, 'SIGHTING_MODERATED', 'sighting', id, {
        status,
        moderator: req.user!.email,
        notes: moderator_notes,
      });

      res.json({ message: `Sighting updated to ${status}.` });
    } catch (err: any) {
      console.error('Moderation error:', err);
      res.status(500).json({ error: 'Failed to update sighting status.' });
    }
  }
);

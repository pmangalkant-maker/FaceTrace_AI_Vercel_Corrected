# FaceTrace AI — Privacy-First Missing-Person Case Management & Image Analysis

FaceTrace AI is a restrained, public-interest missing-person case coordination and photographic quality analysis platform. It connects community eyewitnesses, authorized case coordinators, and law enforcement agencies while upholding strict privacy boundaries and non-biometric standards.

---

## 1. Architectural Overview & Stack Explanation

### Unified Full-Stack Architecture (Default & AI Studio Runtime)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Backend / API**: Node.js v22 + Express mounted via `server.ts` with Vite development middleware.
- **Persistent Database**: Native SQLite (`node:sqlite` DatabaseSync) stored at `data/facetrace.db` with WAL journaling and foreign key constraints.
- **Security & Cryptography**: Native Node `crypto.scryptSync` password hashing with per-user salt, HMAC-SHA256 signed bearer tokens, role-based access control (`public`, `case_manager`, `law_enforcement`, `admin`), rate limiting, and tamper-evident audit logging.
- **Computer Vision & Quality Engine**: Automated Laplacian variance ($\nabla^2$) focal sharpness evaluation, mean luminance histogram meter, resolution standard checks ($\ge 300\times 300\text{px}$), EXIF GPS sanitization, and Viola-Jones / Haar-like candidate face localization.

### Companion Python FastAPI + OpenCV Stack
For environments preferring Python microservices, a complete FastAPI + OpenCV + Pillow backend is included in `/backend`:
- `backend/main.py`: FastAPI server with CORS, routing, and Pydantic schemas.
- `backend/detector.py`: OpenCV `cv2.CascadeClassifier` with `haarcascade_frontalface_default.xml` and Pillow `ImageStat` quality metrics.
- `backend/requirements.txt`: Python package specifications.

---

## 2. Windows PowerShell Setup & Quickstart

### Prerequisites
1. **Node.js**: v20+ or v22+ (Includes native `node:sqlite`). Verify with `node --version`.
2. **Git** (optional).
3. **Python 3.10+** (optional, only if running the standalone Python FastAPI service).

### Quickstart (Unified Full-Stack — Recommended)
Open Windows PowerShell in the project root directory:

```powershell
# 1. Clone or navigate to the repository
cd path\to\facetrace-ai

# 2. Install Node dependencies
# package.json pins esbuild to ^0.28.0 to satisfy Vite 8's peer dependency
npm install

# If npm reports a stale/partial install from an earlier attempt, clean it first:
# Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
# Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
# npm install

# 3. Run the automated test suite (verifies database, auth, EXIF stripping, and image analysis)
npm test

# 4. Start the unified development server
npm run dev
```

The application is immediately accessible at **`http://localhost:3000`**.

### Standalone Python FastAPI Backend Setup (Optional)
If you wish to run the Python backend separately on port 8000:

```powershell
# 1. Create a virtual environment
python -m venv backend\.venv

# 2. Activate virtual environment in PowerShell
# (If script execution is disabled, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
.\backend\.venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r backend\requirements.txt

# 4. Run automated Python tests
pytest backend\test_api.py

# 5. Launch FastAPI backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger documentation will be available at: **`http://localhost:8000/docs`**.

---

## 3. Pre-Configured Test Accounts (Evaluation Credentials)

The database automatically seeds with verified demo accounts and synthetic demo missing-person bulletins:

| Role | Email | Password | Display Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@facetrace.org` | `AdminPass123!` | Elena Rostova |
| **Case Coordinator** | `coordinator@facetrace.org` | `CoordPass123!` | Marcus Thorne |
| **Volunteer** | `volunteer@facetrace.org` | `VolunPass123!` | Sarah Chen |

> *Tip: On the **Sign In** page, click any of the "Quick Evaluation Logins" buttons to instantly log in as that persona.*

---

## 4. Key Pages & Features

1. **Public Home (`/`)**: Urgent emergency guidance advisory, live database metrics, recent active bulletins, search portal, and lawful authority explanation.
2. **Missing Cases Search (`#cases`)**: Search by full name, city, case number, or circumstances; filter by status (Active, Located, Resolved), gender, and age range; tabular numerals and zero-pill metadata.
3. **Case Detail (`#case-detail/:id`)**: Comprehensive demographics, official police incident reference, photo inspector link, verified sightings timeline, and restricted sensitive details for authorized coordinators.
4. **Printable Missing Poster**: Click "Print / Save PDF Poster" on any case to render an official law enforcement community bulletin formatted for distribution.
5. **Report Sighting (`#report-sighting`)**: Structured form for community leads with date/time, exact site location, observation notes, optional photo upload with automated quality checks, and good-faith accuracy affirmation. Submissions enter the moderation queue.
6. **Lawful Intake (`#submit-case`)**: Structured case intake with legal relationship declaration, reporting police agency and incident ID, demographics, circumstances, and reference photo quality checks.
7. **Photo Inspector (`#image-analysis`)**: Forensic photographic tool. Upload or test with demo portraits to view HTML5 canvas Haar-cascade bounding boxes, ocular/oral landmarks, and Laplacian variance blur scores.
8. **User Dashboard (`#user-dashboard`)**: View submitted cases, status of reported sightings, and recent alerts.
9. **Coordinator Management Hub (`#case-management`)**: Workspace for case handlers to edit descriptions, update status (Active, Located, Resolved, Suspended), and review leads.
10. **Admin Dashboard (`#admin-dashboard`)**: Role-protected portal featuring:
    - Sighting Moderation Queue (verify & publish, forward to police privately, or dismiss)
    - Tamper-Evident Audit Trail (filter by action, user, or entity with sanitized IPs)
    - User Role Management (elevate volunteer accounts to verified coordinators)
    - System Health & Database Integrity stats
11. **Notifications Center (`#notifications`)**: Alerts on sighting submissions and case status changes.
12. **Privacy & Lawful Intake Protocol (`#help-privacy`)**: GDPR/CCPA data subject rights, retention & purge policies, and non-biometric disclosures.

---

## 5. Privacy, Ethics & Legal Disclaimers

- **Emergency Protocol**: FaceTrace AI is an informational coordination registry and does not replace emergency dispatch. If someone is in immediate danger, dial local emergency services (911 / 999 / 112) immediately.
- **Non-Biometric Architecture**: FaceTrace AI performs computer-vision feature detection and photographic quality assessment only. The platform **DOES NOT** perform automated biometric identification, identity verification, 1:N facial recognition matching, or mass surveillance queries.
- **No Scraping**: The platform does not ingest public CCTV feeds, social media profiles, or private surveillance cameras.
- **Synthetic Demo Records**: All pre-seeded cases and portraits are synthetic demo records explicitly labeled `[DEMO]` for evaluation and training purposes only.
- **EXIF Sanitization**: Uploaded photographs have geographic GPS tags and device serial numbers scrubbed prior to storage.

---

## 6. Testing & Quality Verification

Run the automated test suite in terminal:

```bash
npm test
```

Verification output:
```text
--- Starting FaceTrace AI Verification & Test Suite ---
  ✓ PASS: Database schema initializes tables and indexes
  ✓ PASS: Password hashing produces secure, salt-dependent scrypt hashes
  ✓ PASS: Session tokens sign and verify with expiration and role payload
  ✓ PASS: Case queries execute with filter conditions and unboxed projection
  ✓ PASS: EXIF sanitizer inspects JPEG APP1 segment
  ✓ PASS: Image analyzer calculates resolution, Laplacian sharpness, and luminance metrics
  ✓ PASS: Sighting lifecycle enforces pending review status and moderator approval
  ✓ PASS: Audit trail logs user events with sanitized records
Test results: 8/8 tests passed.
```

To run TypeScript lint checks:
```bash
npm run lint
```

To run production build:
```bash
npm run build
```

---

## 7. Migration Path & Enterprise Deployment

- **Database Migration**: The SQLite schema in `server/db.ts` uses ANSI SQL compatible with PostgreSQL. For enterprise production deployments on Google Cloud Run or AWS ECS:
  - Migrate tables to Cloud SQL (PostgreSQL).
  - Replace `node:sqlite` connection with `pg` or Drizzle ORM.
  - S3 / Google Cloud Storage buckets can be configured for `uploads/` image storage.
- **Node Production Run**:
  ```bash
  npm run build
  npm start
  ```


## Vercel deployment (single project)

This repository's production UI and primary API are the Vite frontend plus the Node/Express routers in `server/`. The optional `backend/` FastAPI service is not wired to all UI routes, so this deployment intentionally uses the existing Express API rather than routing `/api/*` to the incomplete FastAPI service.

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the project root as `.`. Vercel reads `vercel.json`; the frontend builds to `dist`, and `/api/*` is routed to `api/index.ts`.
4. Deploy and verify `https://YOUR-DEPLOYMENT.vercel.app/api/health`.

### Important persistence limitation

The current database is native SQLite and uploads are stored on the local filesystem. On Vercel, this package redirects these paths to `/tmp` so the function can write during an invocation, but `/tmp` is ephemeral and may be reset between invocations/deployments. **This is not durable production storage.** Before using real cases or personal information, migrate records to a managed persistent database (for example, Postgres) and images to private object storage. Do not rely on the seeded demo accounts for a public production deployment; replace/remove demo credentials and seed data before launch.

### Vercel environment

No custom service-binding variables are required by this single-project configuration. Do not deploy the optional Python FastAPI backend as the public `/api/*` service until its missing auth, sightings, notifications, and admin routes have been implemented and tested.


## Vercel deployment notes

- The invalid `functions.runtime: "nodejs22.x"` override has been removed. Node.js 22 is selected through `package.json` `engines`.
- Vercel's `/tmp` filesystem is temporary. This SQLite database and uploaded images are suitable only for temporary testing, not persistent case records.
- Before using real records, migrate SQLite to a managed persistent database and image uploads to private object storage; configure credentials as Vercel environment variables.
- The included Python FastAPI service in `/backend` is separate and is not deployed by this Vercel configuration.
- The image analysis endpoint performs technical image/face detection only; it does not identify a person or match faces against missing-person records.

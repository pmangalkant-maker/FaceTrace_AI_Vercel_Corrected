import os
import sqlite3
import uuid
import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import CaseIntake, SightingReport, SightingModeration, UserRegister, UserLogin
from .detector import analyze_image_with_opencv_and_pillow

app = FastAPI(
    title="FaceTrace AI - Missing-Person Case Management & Image Analysis API",
    description="Privacy-first missing-person case registry and technical image quality analysis API.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "facetrace.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI + OpenCV + Pillow",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "disclaimer": "Technical detection only. No automated 1:N facial biometric recognition."
    }

@app.post("/api/image/analyze")
async def analyze_image_endpoint(photo: UploadFile = File(...)):
    contents = await photo.read()
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 8MB limit.")
    
    try:
        result = analyze_image_with_opencv_and_pillow(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

@app.get("/api/cases")
def list_cases(
    q: Optional[str] = None,
    status: Optional[str] = "all",
    gender: Optional[str] = "all",
    page: int = 1,
    limit: int = 12,
    db: sqlite3.Connection = Depends(get_db)
):
    query = "SELECT * FROM cases WHERE 1=1"
    params = []
    if q:
        query += " AND (full_name LIKE ? OR case_number LIKE ? OR last_seen_city LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
    if gender and gender != "all":
        query += " AND gender = ?"
        params.append(gender)
    
    cursor = db.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM ({query})", params)
    total = cursor.fetchone()[0]

    query += " ORDER BY date_missing DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])

    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    return {
        "cases": rows,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

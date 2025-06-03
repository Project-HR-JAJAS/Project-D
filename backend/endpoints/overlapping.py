from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext

router = APIRouter()

@router.get("/api/overlapping-sessions")
async def get_overlapping_sessions():
    try:
        db = DbContext()
        sessions = db.get_overlapping_sessions()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/api/overlapping-sessions/{cdr_id}")
async def get_overlaps_for_cdr(cdr_id: str):
    try:
        db = DbContext()
        sessions = db.get_all_overlapping_for_cdr(cdr_id)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/overlapping-cluster/{cdr_id}")
async def get_overlap_cluster(cdr_id: str):
    try:
        db = DbContext()
        result = db.get_overlapping_cluster(cdr_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

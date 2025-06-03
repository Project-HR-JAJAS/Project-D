from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext

router = APIRouter()

@router.get("/api/user-stats")
async def get_user_stats():
    try:
        db = DbContext()
        stats = db.get_user_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")


@router.get("/api/user-details/{auth_id}")
async def get_user_details(auth_id: str):
    try:
        db = DbContext()
        rows = db.get_cdrs_by_authentication_id(auth_id)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user details: {str(e)}")

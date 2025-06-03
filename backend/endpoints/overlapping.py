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


# Endpoit die Authentication_ID, ClusterCount (aantal unieke CDR_IDs in het cluster), TotalVolume, TotalCost haalt
@router.get('/api/overlapping-stats')
async def get_overlapping_stats():
    db = DbContext()
    result = db.get_overlapping_stats()
    return result

# Dit haalt alle overlappende sessies voor een gegeven Authentication_ID op.
@router.get("/api/overlapping-sessions/{auth_id}")
async def get_overlapping_sessions_by_auth_id(auth_id: str):
    try:
        db = DbContext()
        rows = db.get_overlapping_sessions_by_auth_id(auth_id)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overlapping sessions: {str(e)}")


# Endpoint die het hele cluster per Authentication_ID telt 
@router.get('/api/overlapping-cluster-count')
async def get_overlapping_cluster_count():
    db = DbContext()
    result = db.get_overlapping_cluster_count()
    return result


# Endpoit dat de details ophaalt van overlappende CDR’s voor een specifieke CDR_ID.
@router.get("/api/overlapping-details/{cdr_id}")
async def get_overlapping_details_for_cdr(cdr_id: str):
    try:
        db = DbContext()
        sessions = db.get_all_overlapping_for_cdr(cdr_id)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overlapping details: {str(e)}")

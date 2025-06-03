from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext


router = APIRouter()

@router.get("/api/cdr-details/{cdr_id}")
async def get_cdr_details(cdr_id: str):
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()
    cursor.execute("SELECT * FROM CDR WHERE CDR_ID = ?", (cdr_id,))
    cdr_row = cursor.fetchone()
    if not cdr_row:
        db.close()
        raise HTTPException(status_code=404, detail="CDR not found")
    columns = [desc[0] for desc in cursor.description]
    cdr = dict(zip(columns, cdr_row))

    # Get all non-null reasons from FraudCase
    cursor.execute("SELECT Reason1, Reason2, Reason3, Reason4, Reason5, Reason6, Reason7 FROM FraudCase WHERE CDR_ID = ?", (cdr_id,))
    reasons_row = cursor.fetchone()
    reasons = [r for r in reasons_row if r] if reasons_row else []

    latitude = cdr.get('Latitude')
    longitude = cdr.get('Longitude')

    db.close()
    return {
        "cdr": cdr,
        "reasons": reasons,
        "latitude": latitude,
        "longitude": longitude
    }
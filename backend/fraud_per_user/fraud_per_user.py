from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext
router = APIRouter()
    

@router.get("/api/all-authentication-ids-with-fraud")
def get_all_authentication_ids_with_fraud():
    try:
        data = find_unique_authentication_ids_with_fraud()
        return data
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def find_unique_authentication_ids_with_fraud():
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()

    query = """
        SELECT 
            Authentication_ID,
            COUNT(*) AS TransactionCount,
            SUM(Volume) AS TotalVolume,
            SUM(Calculated_Cost) AS TotalCost
        FROM CDR
        WHERE 
            Authentication_ID IN (
                SELECT DISTINCT Authentication_ID
                FROM CDR
                WHERE CDR_ID IN (SELECT CDR_ID FROM FraudCase)
            )
            OR Authentication_ID IS NULL
        GROUP BY Authentication_ID
        ORDER BY Authentication_ID
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    db.close()
    return result


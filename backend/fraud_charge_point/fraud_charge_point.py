from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext
router = APIRouter()
    

@router.get("/api/all-charge-point-ids-with-fraud")
def get_all_charge_point_ids_with_fraud():
    try:
        data = find_unique_charge_point_ids_with_fraud()
        return data
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/api/all-charge-point-ids-with-specific-fraud/{reason}")
def get_all_charge_point_ids_with_specific_fraud(reason: str):
    try:
        data = find_unique_charge_point_ids_with_specific_fraud(reason)
        return data
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def find_unique_charge_point_ids_with_fraud():
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()

    query = """
        SELECT 
            Charge_Point_ID,
            Charge_Point_Country,
            COUNT(*) AS transaction_count,
            SUM(Volume) AS total_volume,
            SUM(Calculated_Cost) AS total_cost
        FROM CDR
        WHERE 
            Charge_Point_ID IN (
                SELECT DISTINCT Charge_Point_ID
                FROM CDR
                WHERE CDR_ID IN (SELECT CDR_ID FROM FraudCase)
            )
            OR Charge_Point_ID IS NULL
        GROUP BY Charge_Point_ID, Charge_Point_Country
        ORDER BY Charge_Point_ID
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    db.close()
    return result

def find_unique_charge_point_ids_with_specific_fraud(reason):
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()

    query = f"""
        SELECT 
            Charge_Point_ID,
            Charge_Point_Country,
            COUNT(*) AS transaction_count,
            SUM(Volume) AS total_volume,
            SUM(Calculated_Cost) AS total_cost
        FROM CDR
        WHERE 
            Charge_Point_ID IN (
                SELECT DISTINCT Charge_Point_ID
                FROM CDR
                WHERE CDR_ID IN (
                    SELECT CDR_ID 
                    FROM FraudCase 
                    WHERE {reason} IS NOT NULL
                )
            )
            OR Charge_Point_ID IS NULL
        GROUP BY Charge_Point_ID, Charge_Point_Country
        ORDER BY Charge_Point_ID
    """

    cursor.execute(query)
    rows = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in rows]

    db.close()
    return result

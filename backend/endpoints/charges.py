from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from backend.data.DbContext import DbContext
import json

router = APIRouter()

# @router.get("/api/charge-details/{timeRange}")
# async def get_charge_details(timeRange: str):
#     try:
#         db = DbContext()
#         db.connect()
        
#         # Map time range to SQL condition
#         time_conditions = {
#             '0000-0900': "time(Start_datetime) >= '00:00:00' AND time(Start_datetime) < '09:00:00'",
#             '0900-1300': "time(Start_datetime) >= '09:00:00' AND time(Start_datetime) < '13:00:00'",
#             '1300-1700': "time(Start_datetime) >= '13:00:00' AND time(Start_datetime) < '17:00:00'",
#             '1700-2100': "time(Start_datetime) >= '17:00:00' AND time(Start_datetime) < '21:00:00'",
#             '2100-0000': "time(Start_datetime) >= '21:00:00' AND time(Start_datetime) <= '23:59:59'"
#         }
        
#         if timeRange not in time_conditions:
#             raise HTTPException(status_code=400, detail="Invalid time range")
            
#         condition = time_conditions[timeRange]
#         query = f"""
#             SELECT 
#                 CDR_ID,
#                 Start_datetime,
#                 End_datetime,
#                 Duration,
#                 Volume,
#                 Charge_Point_Address,
#                 Charge_Point_ZIP,
#                 Charge_Point_City,
#                 Charge_Point_Country,
#                 Charge_Point_Type,
#                 Charge_Point_ID,
#                 Calculated_Cost
#             FROM CDR 
#             WHERE {condition}
#             ORDER BY Start_datetime DESC
#         """
        
#         cursor = db.connection.cursor()
#         cursor.execute(query)
#         columns = [description[0] for description in cursor.description]
#         results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
#         db.close()
#         return Response(
#             content=json.dumps(results),
#             media_type="application/json",
#             headers={
#                 "Cache-Control": "no-cache, no-store, must-revalidate",
#                 "Pragma": "no-cache",
#                 "Expires": "0"
#             }
#         )
        
#     except Exception as e:
#         if db.connection:
#             db.close()
#         raise HTTPException(status_code=500, detail=f"Error fetching charge details: {str(e)}")


@router.get("/api/charge-point-stats")
async def get_charge_point_stats(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None)
):
    try:
        db = DbContext()
        db.connect()
        
        # Prepare filtering clause
        where_clause = ""
        params = []

        if search:
            where_clause = "WHERE LOWER(Charge_Point_ID) LIKE ?"
            params.append(f"%{search.lower()}%")

        # Totaal aantal unieke laadpunten
        count_query = f"""
            SELECT COUNT(*) FROM (
                SELECT Charge_Point_ID, Charge_Point_Country FROM CDR {where_clause} GROUP BY Charge_Point_ID, Charge_Point_Country
            )
        """
        cursor = db.connection.cursor()
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]

        # Data ophalen met LIMIT/OFFSET
        offset = (page - 1) * page_size
        data_query = f"""
            SELECT 
                Charge_Point_ID,
                Charge_Point_Country,
                COUNT(*) as transaction_count,
                SUM(Volume) as total_volume,
                SUM(Calculated_Cost) as total_cost
            FROM CDR 
            {where_clause}
            GROUP BY Charge_Point_ID, Charge_Point_Country
            ORDER BY transaction_count DESC
            LIMIT ? OFFSET ?
        """
        params.extend([page_size, offset])
        cursor.execute(data_query, params)
        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        db.close()
        return Response(
            content=json.dumps({
                "results": results,
                "total": total_count,
                "page": page,
                "page_size": page_size
            }),
            media_type="application/json",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        if db.connection:
            db.close()
        raise HTTPException(status_code=500, detail=f"Error fetching charge point statistics: {str(e)}")



@router.get("/api/charge-point-stats-all")
async def get_all_charge_point_stats():
    try:
        db = DbContext()
        db.connect()
        
        query = """
            SELECT 
                Charge_Point_ID,
                Charge_Point_Country,
                COUNT(*) as transaction_count,
                SUM(Volume) as total_volume,
                SUM(Calculated_Cost) as total_cost
            FROM CDR 
            GROUP BY Charge_Point_ID, Charge_Point_Country
            ORDER BY transaction_count DESC
        """
        
        cursor = db.connection.cursor()
        cursor.execute(query)
        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        db.close()
        return Response(
            content=json.dumps(results),
            media_type="application/json",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
        
    except Exception as e:
        if db.connection:
            db.close()
        raise HTTPException(status_code=500, detail=f"Error fetching charge point statistics: {str(e)}")


@router.get("/api/charge-details/reason/{reason_key}")
async def get_charge_details_by_reason(reason_key: str):
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()
    query = f"""
        SELECT f.*, c.Start_datetime, c.End_datetime, c.Duration, c.Volume, c.Charge_Point_Address, c.Charge_Point_ZIP, c.Charge_Point_City, c.Charge_Point_Country, c.Charge_Point_ID, c.Calculated_Cost
        FROM FraudCase f
        JOIN CDR c ON f.CDR_ID = c.CDR_ID
        WHERE {reason_key} IS NOT NULL AND {reason_key} != ''
    """
    cursor.execute(query)
    columns = [desc[0] for desc in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    db.close()
    return results

@router.get("/api/charge-point-details/{ChargeID}")
async def get_user_details(ChargeID: str):
    try:
        db = DbContext()
        rows = db.get_cdrs_by_charge_point_id(ChargeID)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user details: {str(e)}")

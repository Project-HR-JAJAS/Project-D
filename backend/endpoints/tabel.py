from backend.data.GetData import GetAll
from fastapi import APIRouter, HTTPException, Query
from backend.data.DbContext import DbContext
import json
from fastapi.responses import Response

router = APIRouter()

@router.get("/tabel/all")
async def get_all_records():
    getAllInstance = GetAll()
    data = getAllInstance.fetch_data()
    return data

@router.get("/tabel/{cdrID}")
async def get_one_record(cdrID: str):
    getOneInstance = GetAll()
    data = getOneInstance.fetch_one_data(cdrID)
    return data



@router.get("/api/data-table")
async def get_data_table(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query(None),
    sort_dir: str = Query(None),
    search: str = Query(None)
):
    try:
        db = DbContext()
        db.connect()

        offset = (page - 1) * page_size
        cursor = db.connection.cursor()

        # Prepare filtering clause
        where_clause = ""
        params = []

        if search:
            where_clause = "WHERE LOWER(Authentication_ID) LIKE ?"
            params.append(f"%{search.lower()}%")

        # Total count with search
        total_query = f"SELECT COUNT(*) FROM CDR {where_clause}"
        cursor.execute(total_query, params)
        total = cursor.fetchone()[0]

        # Validate sorting
        valid_sort_columns = {'volume': 'Volume', 'calculated_cost': 'Calculated_Cost'}
        valid_sort_dirs = {'asc', 'desc'}
        order_clause = "ORDER BY Start_datetime DESC"
        if sort_by in valid_sort_columns and sort_dir in valid_sort_dirs:
            order_clause = f"ORDER BY {valid_sort_columns[sort_by]} {sort_dir.upper()}"

        # Data query with search
        data_query = f"""
            SELECT 
                CDR.CDR_ID as id,
                CDR.Authentication_ID as authentication_id,
                CDR.Duration as duration,
                CDR.Volume as volume,
                CDR.Charge_Point_ID as charge_point_id,
                CDR.Calculated_Cost as calculated_cost
            FROM CDR
            INNER JOIN FraudCase ON CDR.CDR_ID = FraudCase.CDR_ID
            ORDER BY CDR.Start_datetime DESC
        """
        params.extend([page_size, offset])
        cursor.execute(data_query, params)

        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        db.close()
        return {
            "results": results,
            "total": total
        }

    except Exception as e:
        if db.connection:
            db.close()
        raise HTTPException(status_code=500, detail=f"Error fetching data table: {str(e)}")



@router.get("/api/data-table-all")
async def get_all_data_table():
    try:
        db = DbContext()
        db.connect()
        cursor = db.connection.cursor()

        query = """
            SELECT 
                CDR.CDR_ID as id,
                CDR.Authentication_ID as authentication_id,
                CDR.Duration as duration,
                CDR.Volume as volume,
                CDR.Charge_Point_ID as charge_point_id,
                CDR.Calculated_Cost as calculated_cost
            FROM CDR
            INNER JOIN FraudCase ON CDR.CDR_ID = FraudCase.CDR_ID
            ORDER BY CDR.Start_datetime DESC
        """
        
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
        raise HTTPException(status_code=500, detail=f"Error fetching data table: {str(e)}")

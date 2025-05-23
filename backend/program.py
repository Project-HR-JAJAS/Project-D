from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from backend.data.GetData import GetAll
from backend.data.DbContext import DbContext
from backend.data.DbUserContext import DbUserContext
from backend.data_per_tijdsvlak.Tijdvlak import router as tijdvlak_router
import os
from typing import Tuple, Optional
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from tkinter.filedialog import asksaveasfilename
import uvicorn
import time
import logging
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
from fastapi import Query
import json
from fastapi.responses import Response
from pydantic import BaseModel
from backend.fraud_locations.Fraude_Locaties import FraudLocationManager
import threading



class UserRequest(BaseModel):
    User_Name: str
    User_Password: str

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tijdvlak_router)

def import_excel_to_db(file_path: str) -> Tuple[bool, str, Optional[int]]:
    try:
        if not os.path.exists(file_path):
            return False, f"File not found at: {file_path}", None

        if not file_path.lower().endswith(('.xlsx', '.xls')):
            return False, "Invalid file format. Please provide an Excel file (.xlsx or .xls)", None

        # Initialize database
        db = DbContext()
        db.initialize_database()  # Ensure the table is created

        # Import the Excel file
        records_imported, error_msg = db.import_excel_to_database(file_path)

        if records_imported > 0:
            return True, f"Successfully imported {records_imported} records", records_imported
        else:
            return False, f"No records were imported. {error_msg}", None

    except Exception as e:
        return False, f"Error importing file: {str(e)}", None

def start_geocoding_process(db_path: str):
    """Start the geocoding process in a background thread."""
    def geocode_task():
        try:
            fraud_manager = FraudLocationManager(db_path)
            fraud_manager.update_charge_point_coordinates()
            fraud_manager.update_fraud_locations()
        except Exception as e:
            logger.error(f"Error in geocoding process: {str(e)}")

    thread = threading.Thread(target=geocode_task)
    thread.daemon = True
    thread.start()

@app.post("/api/import")
async def import_excel(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    start_time = time.time()
    try:
        logger.info(f"Starting file import for: {file.filename}")
        
        # Create a temporary file to store the uploaded content
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Import the file using the existing function
        success, message, records_imported = import_excel_to_db(temp_file_path)
        
        # Clean up the temporary file
        os.remove(temp_file_path)
        
        processing_time = time.time() - start_time
        logger.info(f"File import completed in {processing_time:.2f} seconds. Imported {records_imported} records.")
        
        if success and records_imported:
            # Start geocoding process in background
            # db = DbContext()
            # background_tasks.add_task(start_geocoding_process, db.db_name)
            
            return {
                "success": True,
                "message": f"{message} in {processing_time:.2f} seconds. Geocoding process started in background.",
                "count": records_imported,
                "processingTime": processing_time
            }
        else:
            return {
                "success": False,
                "message": message,
                "count": 0,
                "processingTime": processing_time
            }
            
    except Exception as e:
        return False, f"Error importing file: {str(e)}", None


@app.get("/api/export")
async def export_excel(format: str = "xlsx", columns: Optional[str] = Query(None)):
    if format not in ["xlsx", "csv"]:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'xlsx' or 'csv'.")

    try:
        # Create a temporary file for the export
        suffix = ".xlsx" if format == "xlsx" else ".csv"
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            output_path = tmp.name

        # Export the data using existing logic
        db = DbContext()
        success, record_count = db.export_cdr_to_file(output_path, columns)


        if not success:
            os.remove(output_path)
            if record_count == 0:
                raise HTTPException(status_code=404, detail="No data found in the database. Please import data first.")
            else:
                raise HTTPException(status_code=500, detail="Failed to export database.")

        # Return file as response
        return FileResponse(
            path=output_path,
            filename=f"cdr_export{suffix}",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")
    
# def export_db_to_file():
#     db = DbContext()
#     root = Tk()
#     root.withdraw()  # hides the Tkinter window

# @app.get("/api/charge-counts")
# async def get_charge_counts():
#     try:
#         db = DbContext()
#         db.connect()
        
#         # Define time ranges
#         time_ranges = [
#             ('0000-0900', "time(Start_datetime) >= '00:00:00' AND time(Start_datetime) < '09:00:00'"),
#             ('0900-1300', "time(Start_datetime) >= '09:00:00' AND time(Start_datetime) < '13:00:00'"),
#             ('1300-1700', "time(Start_datetime) >= '13:00:00' AND time(Start_datetime) < '17:00:00'"),
#             ('1700-2100', "time(Start_datetime) >= '17:00:00' AND time(Start_datetime) < '21:00:00'"),
#             ('2100-0000', "time(Start_datetime) >= '21:00:00' AND time(Start_datetime) <= '23:59:59'")
#         ]
        
#         results = []
#         for time_range, condition in time_ranges:
#             query = f"SELECT COUNT(*) as count FROM CDR WHERE {condition}"
#             cursor = db.connection.cursor()
#             cursor.execute(query)
#             count = cursor.fetchone()[0]
#             results.append({
#                 "TimeRange": time_range,
#                 "TotalCharges": count
#             })
        
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
#         raise HTTPException(status_code=500, detail=f"Error fetching charge counts: {str(e)}")


@app.get("/tabel/all")
async def get_all_records():
    getAllInstance = GetAll()
    data = getAllInstance.fetch_data()
    return data

@app.get("/tabel/{cdrID}")
async def get_one_record(cdrID: str):
    getOneInstance = GetAll()
    data = getOneInstance.fetch_one_data(cdrID)
    return data

@app.get("/api/charge-details/{timeRange}")
async def get_charge_details(timeRange: str):
    try:
        db = DbContext()
        db.connect()
        
        # Map time range to SQL condition
        time_conditions = {
            '0000-0900': "time(Start_datetime) >= '00:00:00' AND time(Start_datetime) < '09:00:00'",
            '0900-1300': "time(Start_datetime) >= '09:00:00' AND time(Start_datetime) < '13:00:00'",
            '1300-1700': "time(Start_datetime) >= '13:00:00' AND time(Start_datetime) < '17:00:00'",
            '1700-2100': "time(Start_datetime) >= '17:00:00' AND time(Start_datetime) < '21:00:00'",
            '2100-0000': "time(Start_datetime) >= '21:00:00' AND time(Start_datetime) <= '23:59:59'"
        }
        
        if timeRange not in time_conditions:
            raise HTTPException(status_code=400, detail="Invalid time range")
            
        condition = time_conditions[timeRange]
        query = f"""
            SELECT 
                CDR_ID,
                Start_datetime,
                End_datetime,
                Duration,
                Volume,
                Charge_Point_Address,
                Charge_Point_ZIP,
                Charge_Point_City,
                Charge_Point_Country,
                Charge_Point_Type,
                Charge_Point_ID,
                Calculated_Cost
            FROM CDR 
            WHERE {condition}
            ORDER BY Start_datetime DESC
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
        raise HTTPException(status_code=500, detail=f"Error fetching charge details: {str(e)}")

def export_db_to_file():
    db = DbContext()
    root = Tk()
    root.withdraw()  # hides the Tkinter window

#     output_path = asksaveasfilename(
#         title="Save as",
#         defaultextension=".xlsx",
#         filetypes=[
#             ("Excel file", "*.xlsx *.xls"), ("CSV file", "*.csv")
#         ]
#     )

#     root.destroy()

#     if not output_path:
#         print("Export cancelled.")
#         return

#     success = db.export_cdr_to_file(output_path)
#     if success:
#         print("Export completed.")
#     else:
#         print("Export failed.")

@app.get("/api/overlapping-sessions")
async def get_overlapping_sessions():
    try:
        db = DbContext()
        sessions = db.get_overlapping_sessions()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# # Filters op datum, locatie, gebruiker
# @app.get("/api/overlapping-sessions")
# async def get_overlapping_sessions(
#     start_date: Optional[str] = Query(None),
#     end_date: Optional[str] = Query(None),
#     city: Optional[str] = Query(None),
#     auth_id: Optional[str] = Query(None),
# ):
#     try:
#         db = DbContext()
#         sessions = db.get_overlapping_sessions()
#         if start_date:
#             sessions = [s for s in sessions if s['Start_datetime'] >= start_date]
#         if end_date:
#             sessions = [s for s in sessions if s['End_datetime'] <= end_date]
#         if city:
#             sessions = [s for s in sessions if s['Charge_Point_City'] == city]
#         if auth_id:
#             sessions = [s for s in sessions if s['Authentication_ID'] == auth_id]
#         return sessions
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# Endpoint voor details per sessie
@app.get("/api/overlapping-sessions/{cdr_id}")
async def get_overlaps_for_cdr(cdr_id: str):
    try:
        db = DbContext()
        sessions = db.get_all_overlapping_for_cdr(cdr_id)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint die alle statistieken per Authentication_ID retourneert voor gebruik in frontend-tabellen
@app.get("/api/user-stats")
async def get_user_stats():
    try:
        db = DbContext()
        stats = db.get_user_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")


@app.get("/api/charge-point-stats")
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

@app.get("/api/data-table")
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
                CDR_ID as id,
                Authentication_ID as authentication_id,
                Duration as duration,
                Volume as volume,
                Charge_Point_ID as charge_point_id,
                Calculated_Cost as calculated_cost
            FROM CDR
            {where_clause}
            {order_clause}
            LIMIT ? OFFSET ?
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

@app.get("/api/charge-point-stats-all")
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

@app.get("/api/data-table-all")
async def get_all_data_table():
    try:
        db = DbContext()
        db.connect()
        cursor = db.connection.cursor()

        query = """
            SELECT 
                CDR_ID as id,
                Authentication_ID as authentication_id,
                Duration as duration,
                Volume as volume,
                Charge_Point_ID as charge_point_id,
                Calculated_Cost as calculated_cost
            FROM CDR
            ORDER BY Start_datetime DESC
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

@app.get("/import-log")
async def get_import_logs():
    parse_import = GetAll()
    parsed_lines = []

    try:
        with open("import_log.txt", "r") as f:
            lines = f.readlines()[-20:]  # get last 20 lines
            for line in lines:
                parsed = parse_import.parse_import_log_line(line)
                if parsed:
                    parsed_lines.append(parsed)
    except FileNotFoundError:
        return [{"error": "import_log.txt not found"}]

    return list(reversed(parsed_lines))


@app.get("/api/overlapping-cluster/{cdr_id}")
async def get_overlap_cluster(cdr_id: str):
    try:
        db = DbContext()
        result = db.get_overlapping_cluster(cdr_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/user-details/{auth_id}")
async def get_user_details(auth_id: str):
    try:
        db = DbContext()
        rows = db.get_cdrs_by_authentication_id(auth_id)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user details: {str(e)}")



@app.post("/api/create/user")
async def create_user(user_data: dict):
    try:
        db = DbUserContext()
        db.connect()
        if (db.insert_user(user_data)):
            return {"message": "User created successfully"}
        else:
            raise HTTPException(status_code=500, detail=f"Username already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    finally:
        db.close()

@app.post("/api/user")
async def get_user(user_data: UserRequest):
    try:
        db = DbUserContext()
        db.connect()
        user = db.get_user(user_data.User_Name, user_data.User_Password)
        if user:
            return user
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"User not found")
    finally:
        db.close()

@app.get("/api/fraud-locations")
async def get_fraud_locations():
    try:
        db = DbContext()
        fraud_location_manager = FraudLocationManager(db.db_name)
        
        # First try to update the fraud locations
        try:
            fraud_location_manager.update_fraud_locations()
        except Exception as e:
            logger.error(f"Error updating fraud locations: {str(e)}")
            # Continue anyway to try to get existing locations
        
        # Then get the locations
        locations = fraud_location_manager.get_all_fraud_locations()
        
        if not locations:
            return Response(
                content=json.dumps({"message": "No fraud locations found"}),
                media_type="application/json",
                status_code=200
            )
            
        return Response(
            content=json.dumps(locations),
            media_type="application/json",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    except Exception as e:
        logger.error(f"Error in fraud locations endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching fraud locations: {str(e)}"
        )

if __name__ == "__main__":
    db = DbUserContext()
    db.initialize_user_database()
    uvicorn.run(app, host="0.0.0.0", port=8000)

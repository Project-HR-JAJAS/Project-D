from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
from pathlib import Path
import time
import logging
import os
from typing import Tuple, Optional
from backend.data.DbContext import DbContext
from backend.data.GetData import GetAll

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


router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/api/import")
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



@router.get("/import-log")
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




@router.get("/api/fraud-cases-for-import")
async def get_fraud_cases_for_import(filename: str = Query(...)):
    """
    Given a filename, return fraud cases for all CDRs imported from that file (using import_filename column), including city, address, and country.
    """
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()
    cursor.execute("""
        SELECT CDR_ID FROM CDR WHERE import_filename = ?
    """, (filename,))
    cdr_ids = [row[0] for row in cursor.fetchall()]
    fraud_cases = []
    if cdr_ids:
        batch_size = 900  # safely below SQLite's 999 limit
        for i in range(0, len(cdr_ids), batch_size):
            batch = cdr_ids[i:i+batch_size]
            format_strings = ','.join(['?'] * len(batch))
            cursor.execute(f"""
                SELECT f.*, c.Charge_Point_City, c.Charge_Point_Address, c.Charge_Point_Country
                FROM FraudCase f
                JOIN CDR c ON f.CDR_ID = c.CDR_ID
                WHERE f.CDR_ID IN ({format_strings})
            """, batch)
            fraud_cases.extend(cursor.fetchall())
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in fraud_cases]
    else:
        result = []
    db.close()
    return result

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from Data.DbContext import DbContext
import os
from typing import Tuple, Optional
import uvicorn
import time
import logging

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
        records_imported = db.import_excel_to_database(file_path)
        
        if records_imported > 0:
            return True, f"Successfully imported {records_imported} records", records_imported
        else:
            return False, "No records were imported. Please check the Excel file format.", None
            
    except Exception as e:
        return False, f"Error importing file: {str(e)}", None

@app.post("/api/import")
async def import_excel(file: UploadFile = File(...)):
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
                "message": f"{message} in {processing_time:.2f} seconds",
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
        processing_time = time.time() - start_time
        logger.error(f"Error importing file: {str(e)}. Processing time: {processing_time:.2f} seconds")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
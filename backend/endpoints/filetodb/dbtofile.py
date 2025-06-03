from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
from typing import Optional
import os
from backend.data.DbContext import DbContext


router = APIRouter()

@router.get("/api/export")
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

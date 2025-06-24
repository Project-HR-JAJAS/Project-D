from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
from typing import Optional
import os
from backend.data.DbContext import DbContext


router = APIRouter()

@router.get("/api/export")
async def export_excel(
    format: str = "xlsx",
    columns: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    if format not in ["xlsx", "csv"]:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'xlsx' or 'csv'.")

    try:
        suffix = ".xlsx" if format == "xlsx" else ".csv"
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            output_path = tmp.name

        db = DbContext()
        success, record_count = db.export_cdr_to_file(output_path, columns, start_date, end_date)

        if not success:
            os.remove(output_path)
            if record_count == 0:
                raise HTTPException(status_code=404, detail="No data found for selected period.")
            else:
                raise HTTPException(status_code=500, detail="Failed to export database.")

        return FileResponse(
            path=output_path,
            filename=f"cdr_export{suffix}",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            if format == "xlsx" else "text/csv"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")


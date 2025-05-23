from fastapi import APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from data.DbContext import DbContext

router = APIRouter()


@router.get("/api/charge-counts")
def get_charge_counts():
    try:
        data = fetch_charge_counts()
        return data
    except Exception as e:
        print(f"Error in charge_counts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/api/charge-details/{time_range}")
def get_charge_details(time_range: str):
    valid_ranges = ["0000-0900", "0900-1300", "1300-1700", "1700-2100", "2100-0000"]
    if time_range not in valid_ranges:
        raise HTTPException(status_code=400, detail="Invalid time range")

    try:
        data = fetch_charge_details(time_range)
        return data
    except Exception as e:
        print(f"Error in charge_details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def fetch_charge_counts():
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()

        query = """
        SELECT 
            CASE 
                WHEN time(c.Start_datetime) BETWEEN '00:00:00' AND '08:59:59' THEN '0000-0900'
                WHEN time(c.Start_datetime) BETWEEN '09:00:00' AND '12:59:59' THEN '0900-1300'
                WHEN time(c.Start_datetime) BETWEEN '13:00:00' AND '16:59:59' THEN '1300-1700'
                WHEN time(c.Start_datetime) BETWEEN '17:00:00' AND '20:59:59' THEN '1700-2100'
                WHEN time(c.Start_datetime) >= '21:00:00' OR time(c.Start_datetime) BETWEEN '00:00:00' AND '00:59:59' THEN '0000-0900'
            END as TimeRange,
            COUNT(DISTINCT c.CDR_ID) as TotalCharges
        FROM CDR c
        INNER JOIN FraudCase f ON c.CDR_ID = f.CDR_ID
        GROUP BY TimeRange
        ORDER BY TimeRange
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        time_ranges = ["0000-0900", "0900-1300", "1300-1700", "1700-2100", "2100-0000"]
        result = {tr: {"TotalCharges": 0} for tr in time_ranges}

        for row in rows:
            time_range = row[0]
            if time_range in result:
                result[time_range]["TotalCharges"] = row[1]

        formatted_result = [
            {"TimeRange": tr, "TotalCharges": data["TotalCharges"]}
            for tr, data in result.items()
        ]

        return formatted_result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        db.close()


def fetch_charge_details(time_range):
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()

        time_conditions = {
            "0000-0900": "time(Start_datetime) BETWEEN '00:00:00' AND '08:59:59'",
            "0900-1300": "time(Start_datetime) BETWEEN '09:00:00' AND '12:59:59'",
            "1300-1700": "time(Start_datetime) BETWEEN '13:00:00' AND '16:59:59'",
            "1700-2100": "time(Start_datetime) BETWEEN '17:00:00' AND '20:59:59'",
            "2100-0000": "(time(Start_datetime) >= '21:00:00' OR time(c.Start_datetime) BETWEEN '00:00:00' AND '00:59:59' THEN '0000-0900'",
        }

        if time_range not in time_conditions:
            return []

        query = f"""
        SELECT DISTINCT c.*
        FROM CDR c
        INNER JOIN FraudCase f ON c.CDR_ID = f.CDR_ID
        WHERE {time_conditions[time_range]}
        """

        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()

        return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        db.close()

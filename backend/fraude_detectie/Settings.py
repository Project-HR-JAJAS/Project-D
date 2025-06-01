from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import os

router = APIRouter()

class FraudThresholds(BaseModel):
    maxVolumeKwh: float
    maxDurationMinutes: float
    minCostThreshold: float
    minTimeGapMinutes: float
    behaviorThreshold: int
    minDistanceKm: float
    minTravelTimeMinutes: float

# Get current thresholds
@router.get("/fraud-thresholds")
def get_fraud_thresholds():
    try:
        conn = sqlite3.connect("project-d.db")
        cursor = conn.cursor()
        
        cursor.execute("SELECT name, value FROM ThresholdSettings")
        rows = cursor.fetchall()
        
        # Convert to dictionary
        thresholds = {row[0]: row[1] for row in rows}
        
        return {
            "maxVolumeKwh": float(thresholds.get("MAX_VOLUME_KWH", 22)),
            "maxDurationMinutes": float(thresholds.get("MAX_DURATION_MINUTES", 60)),
            "minCostThreshold": float(thresholds.get("MIN_COST_THRESHOLD", 20)),
            "minTimeGapMinutes": float(thresholds.get("MIN_TIME_GAP_MINUTES", 30)),
            "behaviorThreshold": int(thresholds.get("THRESHOLD", 3)),
            "minDistanceKm": float(thresholds.get("MIN_DISTANCE_KM", 10)),
            "minTravelTimeMinutes": float(thresholds.get("MIN_TRAVEL_TIME_MINUTES", 15))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Update thresholds
@router.post("/fraud-thresholds")
def update_fraud_thresholds(thresholds: FraudThresholds):
    try:
        conn = sqlite3.connect("project-d.db")
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ThresholdSettings (
            name TEXT PRIMARY KEY,
            value REAL NOT NULL
        )
        """)
        
        # Prepare data for upsert
        data = [
            ("MAX_VOLUME_KWH", thresholds.maxVolumeKwh),
            ("MAX_DURATION_MINUTES", thresholds.maxDurationMinutes),
            ("MIN_COST_THRESHOLD", thresholds.minCostThreshold),
            ("MIN_TIME_GAP_MINUTES", thresholds.minTimeGapMinutes),
            ("THRESHOLD", thresholds.behaviorThreshold),
            ("MIN_DISTANCE_KM", thresholds.minDistanceKm),
            ("MIN_TRAVEL_TIME_MINUTES", thresholds.minTravelTimeMinutes)
        ]
        
        # Upsert all values
        cursor.executemany("""
        INSERT INTO ThresholdSettings (name, value)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET value = excluded.value
        """, data)
        
        conn.commit()
        return {"message": "Thresholds updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
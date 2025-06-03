from fastapi import APIRouter, HTTPException
from backend.data.DbContext import DbContext
from backend.fraud_locations.Fraude_Locaties import FraudLocationManager
import json
from fastapi.responses import Response
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/api/fraud-locations")
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


@router.post("/api/geocode-cdr/{cdr_id}")
async def geocode_cdr_location(cdr_id: str):
    db = DbContext()
    db.connect()
    cursor = db.connection.cursor()
    cursor.execute("SELECT Charge_Point_Address, Charge_Point_ZIP, Charge_Point_City, Charge_Point_Country FROM CDR WHERE CDR_ID = ?", (cdr_id,))
    row = cursor.fetchone()
    if not row:
        db.close()
        raise HTTPException(status_code=404, detail="CDR not found")
    address, zip_code, city, country = row

    # Use your geocoding logic here (reuse from FraudLocationManager or similar)
    geocoder = FraudLocationManager(db.db_name)
    print(f"Geocoding CDR_ID={cdr_id}: address='{address}', zip='{zip_code}', city='{city}', country='{country}'")
    coords = geocoder.geocode_address(address, zip_code, city, country)
    if coords:
        cursor.execute("UPDATE CDR SET Latitude = ?, Longitude = ? WHERE CDR_ID = ?", (coords['latitude'], coords['longitude'], cdr_id))
        db.connection.commit()
        
        # Update fraud locations after saving coordinates
        try:
            geocoder.update_fraud_locations()
        except Exception as e:
            logger.error(f"Error updating fraud locations after geocoding: {str(e)}")
            # Continue anyway since coordinates were saved successfully
        
        db.close()
        return {"latitude": coords['latitude'], "longitude": coords['longitude']}
    else:
        db.close()
        raise HTTPException(status_code=404, detail="Could not geocode address")


@router.post("/api/geocode-batch")
async def geocode_batch(count: int = 20):
    try:
        manager = FraudLocationManager("backend/project-d.db")
        updated = manager.update_charge_point_coordinates_batch(count)
        return {"message": f"Geocoded {updated} new locations."}
    except Exception as e:
        return {"message": f"Error: {str(e)}"}

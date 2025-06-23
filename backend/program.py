from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.data.DbContext import DbContext
from backend.data.DbUserContext import DbUserContext
from tkinter import Tk
import uvicorn
import logging
from backend.fraud_locations.Fraude_Locaties import FraudLocationManager
import threading
from fastapi import HTTPException
from backend.fraude_detectie.Settings import router as settings_router
from backend.data_per_tijdsvlak.Tijdvlak import router as tijdvlak_router
from backend.endpoints.filetodb.importtodb import router as import_router
from backend.endpoints.filetodb.dbtofile import router as export_router
from backend.endpoints.tabel import router as tabel_router
from backend.endpoints.fraud_reasons import router as fraud_reasons_router
from backend.endpoints.charges import router as charge_details_router
from backend.endpoints.overlapping import router as overlapping_router
from backend.endpoints.user_stats import router as user_stats_router
from backend.endpoints.User import router as user_router
from backend.endpoints.CDR import router as cdr_router
from backend.endpoints.locations import router as locations_router
from backend.fraud_per_user.fraud_per_user import router as fraud_per_user_router
from backend.fraud_charge_point.fraud_charge_point import router as fraud_charge_points_router

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

app.include_router(settings_router)
app.include_router(tijdvlak_router)
app.include_router(fraud_per_user_router)
app.include_router(import_router)
app.include_router(export_router)
app.include_router(tabel_router)
app.include_router(fraud_reasons_router)
app.include_router(charge_details_router)
app.include_router(overlapping_router)
app.include_router(user_stats_router)
app.include_router(user_router)
app.include_router(cdr_router)
app.include_router(locations_router)
app.include_router(fraud_charge_points_router)

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


def export_db_to_file():
    db = DbContext()
    root = Tk()
    root.withdraw()  # hides the Tkinter window

# @app.get("/api/overlapping-sessions")
# async def get_overlapping_sessions():
#     try:
#         db = DbContext()
#         sessions = db.get_overlapping_sessions()
#         return sessions
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # Endpoit die Authentication_ID, ClusterCount (aantal unieke CDR_IDs in het cluster), TotalVolume, TotalCost haalt
# @app.get('/api/overlapping-stats')
# async def get_overlapping_stats():
#     db = DbContext()
#     result = db.get_overlapping_stats()
#     return result

# # Dit haalt alle overlappende sessies voor een gegeven Authentication_ID op.
# @app.get("/api/overlapping-sessions/{auth_id}")
# async def get_overlapping_sessions_by_auth_id(auth_id: str):
#     try:
#         db = DbContext()
#         rows = db.get_overlapping_sessions_by_auth_id(auth_id)
#         return rows
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching overlapping sessions: {str(e)}")


# # Endpoint die het hele cluster per Authentication_ID telt 
# @app.get('/api/overlapping-cluster-count')
# async def get_overlapping_cluster_count():
#     db = DbContext()
#     result = db.get_overlapping_cluster_count()
#     return result


# # Endpoit dat de details ophaalt van overlappende CDR’s voor een specifieke CDR_ID.
# @app.get("/api/overlapping-details/{cdr_id}")
# async def get_overlapping_details_for_cdr(cdr_id: str):
#     try:
#         db = DbContext()
#         sessions = db.get_all_overlapping_for_cdr(cdr_id)
#         return sessions
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching overlapping details: {str(e)}")


if __name__ == "__main__":
    db = DbUserContext()
    db.initialize_user_database()
    uvicorn.run(app, host="0.0.0.0", port=8000)

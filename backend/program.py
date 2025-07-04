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
from backend.sessions.session_manager import SessionManager
from backend.fraud_decision.decision_manager import FraudDecisionManager
from backend.fraude_detectie.Fraude_detectie import FraudDetector
import os

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

def initialize_all_databases():
    """Initialize all databases and tables required by the application."""
    try:
        # Get the base directory for database files
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Initialize user database
        logger.info("Initializing user database...")
        user_db = DbUserContext()
        user_db.initialize_user_database()
        
        # Initialize main CDR database
        logger.info("Initializing CDR database...")
        cdr_db = DbContext()
        cdr_db.initialize_database()
        
        # Initialize sessions table
        logger.info("Initializing sessions table...")
        session_manager = SessionManager(os.path.join(base_dir, "user.db"))
        session_manager.create_sessions_table()
        
        # Initialize fraud decision table
        logger.info("Initializing fraud decision table...")
        decision_manager = FraudDecisionManager(os.path.join(base_dir, "project-d.db"))
        decision_manager.create_decision_table()
        
        # Initialize fraud locations table and add coordinate columns to CDR
        logger.info("Initializing fraud locations table...")
        fraud_location_manager = FraudLocationManager(os.path.join(base_dir, "project-d.db"))
        # The initialize_tables method is called in the constructor
        
        # Initialize fraud detection tables (ThresholdSettings and FraudCase)
        logger.info("Initializing fraud detection tables...")
        fraud_detector = FraudDetector(os.path.join(base_dir, "project-d.db"))
        # The load_thresholds method creates ThresholdSettings table
        # The _create_fraud_table method creates FraudCase table
        
        logger.info("All databases initialized successfully!")
        
    except Exception as e:
        logger.error(f"Error initializing databases: {str(e)}")
        raise

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

if __name__ == "__main__":
    # Initialize all databases and tables
    initialize_all_databases()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

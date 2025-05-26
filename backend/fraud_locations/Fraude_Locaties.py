import sqlite3
from typing import List, Dict, Optional
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
import logging
from fastapi import HTTPException
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FraudLocationManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.geolocator = Nominatim(user_agent="fraud_detection_system")
        self.initialize_tables()

    def initialize_tables(self):
        """Initialize the tables if they don't exist."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Add coordinate columns to CDR table if they don't exist
                try:
                    cursor.execute("ALTER TABLE CDR ADD COLUMN Latitude REAL")
                    cursor.execute("ALTER TABLE CDR ADD COLUMN Longitude REAL")
                except sqlite3.OperationalError:
                    # Columns might already exist
                    pass

                # Create FraudLocations table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS FraudLocations (
                        Location_ID TEXT PRIMARY KEY,
                        Charge_Point_ID TEXT NOT NULL,
                        Address TEXT,
                        ZIP TEXT,
                        City TEXT,
                        Country TEXT,
                        Latitude REAL NOT NULL,
                        Longitude REAL NOT NULL,
                        Fraud_Count INTEGER DEFAULT 1,
                        Last_Detected_Date TEXT,
                        FOREIGN KEY (Charge_Point_ID) REFERENCES CDR(Charge_Point_ID)
                    )
                """)
                conn.commit()
                logger.info("Tables initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing tables: {str(e)}")
            raise

    def format_dutch_address(self, address: str, zip_code: str, city: str) -> str:
        """Format Dutch address for geocoding."""
        # Clean up the address
        address = address.strip()
        zip_code = zip_code.strip()
        city = city.strip()
        
        # Format: "Street Number, ZIP City, Netherlands"
        return f"{address}, {zip_code} {city}, Netherlands"

    def clean_address(self, address: str, zip_code: str, city: str) -> str:
        """Remove city and zip_code (with or without space) from address if present."""
        address = address.strip()
        zip_code = zip_code.strip()
        city = city.strip()

        # Normalize ZIP: remove all spaces for matching
        zip_no_space = zip_code.replace(' ', '')
        address_no_commas = address.replace(',', '')

        address = re.sub(rf'\b{re.escape(zip_code)}\b', '', address, flags=re.IGNORECASE)
        address = re.sub(rf'\b{re.escape(zip_no_space)}\b', '', address, flags=re.IGNORECASE)
        address = re.sub(rf'\b{re.escape(address_no_commas)}\b', '', address, flags=re.IGNORECASE)
        # Remove city
        address = re.sub(rf'\b{re.escape(city)}\b', '', address, flags=re.IGNORECASE)
        # Remove extra commas and spaces
        address = re.sub(r',+', ',', address)
        address = re.sub(r',\s*,', ',', address)
        address = re.sub(r'\s{2,}', ' ', address)
        address = address.strip(' ,')
        return address

    def geocode_address(self, address: str, zip_code: str, city: str, country: str) -> Optional[Dict[str, float]]:
        """Convert address to coordinates using geocoding."""
        try:
            # Clean up the address
            address = self.clean_address(address, zip_code, city)
            # Format the address specifically for Dutch addresses
            if country == 'NLD':
                full_address = f"{address}, {zip_code} {city}, Netherlands"
            else:
                full_address = f"{address}, {zip_code}, {city}, {country}"
            
            print(f"Attempting to geocode: {full_address}")
            
            # Add a small delay to respect rate limits
            time.sleep(1)
            
            location = self.geolocator.geocode(full_address)
            if location:
                print(f"Successfully geocoded: {full_address}")
                return {
                    "latitude": location.latitude,
                    "longitude": location.longitude
                }
            else:
                print(f"No results found for: {full_address}")
                return None
                
        except GeocoderTimedOut:
            print(f"Geocoding timed out for: {full_address}")
            time.sleep(2)  # Wait longer before retrying
            return self.geocode_address(address, zip_code, city, country)
        except GeocoderServiceError as e:
            print(f"Geocoding service error: {str(e)}")
            time.sleep(5)  # Wait even longer for service errors
            return None
        except Exception as e:
            print(f"Unexpected geocoding error: {str(e)}")
            return None

    def update_charge_point_coordinates(self):
        """Update coordinates for all Dutch charge points in CDR table."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get unique Dutch charge points without coordinates
            cursor.execute("""
                SELECT DISTINCT 
                    Charge_Point_ID,
                    Charge_Point_Address,
                    Charge_Point_ZIP,
                    Charge_Point_City,
                    Charge_Point_Country
                FROM CDR
                WHERE (Latitude IS NULL OR Longitude IS NULL)
                AND Charge_Point_Address IS NOT NULL
                AND Charge_Point_ZIP IS NOT NULL
                AND Charge_Point_City IS NOT NULL
                AND Charge_Point_Country = 'NLD'
            """)
            
            charge_points = cursor.fetchall()
            total_points = len(charge_points)
            print(f"Found {total_points} Dutch charge points to process")
            
            for i, cp in enumerate(charge_points, 1):
                charge_point_id, address, zip_code, city, country = cp
                print(f"\nProcessing charge point {i}/{total_points}: {charge_point_id}")
                print(f"Address: {address}")
                print(f"ZIP: {zip_code}")
                print(f"City: {city}")
                
                # Get coordinates
                coords = self.geocode_address(address, zip_code, city, country)
                
                if coords:
                    # Update all records for this charge point
                    cursor.execute("""
                        UPDATE CDR
                        SET Latitude = ?,
                            Longitude = ?
                        WHERE Charge_Point_ID = ?
                    """, (coords['latitude'], coords['longitude'], charge_point_id))
                    print(f"Updated coordinates for {charge_point_id}: {coords['latitude']}, {coords['longitude']}")
                else:
                    print(f"Could not geocode address for {charge_point_id}")
                
                # Commit every 10 records to avoid losing progress
                if i % 10 == 0:
                    conn.commit()
                    print(f"Committed {i} records")
            
            conn.commit()
            print("Finished updating Dutch charge point coordinates")

    def update_charge_point_coordinates_batch(self, count: int):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT 
                    Charge_Point_ID,
                    Charge_Point_Address,
                    Charge_Point_ZIP,
                    Charge_Point_City,
                    Charge_Point_Country
                FROM CDR
                WHERE (Latitude IS NULL OR Longitude IS NULL)
                AND Charge_Point_Address IS NOT NULL
                AND Charge_Point_ZIP IS NOT NULL
                AND Charge_Point_City IS NOT NULL
                AND Charge_Point_Country = 'NLD'
                LIMIT ?
            """, (count,))
            charge_points = cursor.fetchall()
            updated = 0
            for cp in charge_points:
                charge_point_id, address, zip_code, city, country = cp
                coords = self.geocode_address(address, zip_code, city, country)
                if coords:
                    cursor.execute("""
                        UPDATE CDR
                        SET Latitude = ?, Longitude = ?
                        WHERE Charge_Point_ID = ?
                    """, (coords['latitude'], coords['longitude'], charge_point_id))
                    updated += 1
            conn.commit()
            return updated

    def update_fraud_locations(self):
        """Update fraud locations based on FraudCase and CDR tables."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # First, clear existing fraud locations to avoid duplicates
                cursor.execute("DELETE FROM FraudLocations")
                logger.info("Cleared existing fraud locations")
                
                # Get all fraud cases with their charge point details
                cursor.execute("""
                    SELECT 
                        c.Charge_Point_ID,
                        c.Charge_Point_Address,
                        c.Charge_Point_ZIP,
                        c.Charge_Point_City,
                        c.Charge_Point_Country,
                        c.Latitude,
                        c.Longitude,
                        COUNT(f.CDR_ID) as fraud_count,
                        MAX(c.Start_datetime) as last_detected
                    FROM FraudCase f
                    JOIN CDR c ON f.CDR_ID = c.CDR_ID
                    WHERE c.Latitude IS NOT NULL 
                    AND c.Longitude IS NOT NULL
                    GROUP BY c.Charge_Point_ID
                """)
                
                fraud_cases = cursor.fetchall()
                total_cases = len(fraud_cases)
                logger.info(f"Found {total_cases} fraud locations to process")
                
                if total_cases == 0:
                    logger.warning("No fraud cases found in the database")
                    return
                
                for i, case in enumerate(fraud_cases, 1):
                    try:
                        charge_point_id, address, zip_code, city, country, lat, lng, fraud_count, last_detected = case
                        logger.info(f"Processing fraud location {i}/{total_cases}: {charge_point_id}")
                        
                        # Insert new record
                        location_id = f"LOC_{charge_point_id}"
                        cursor.execute("""
                            INSERT INTO FraudLocations (
                                Location_ID, Charge_Point_ID, Address, ZIP, City, Country,
                                Latitude, Longitude, Fraud_Count, Last_Detected_Date
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            location_id, charge_point_id, address, zip_code, city, country,
                            lat, lng, fraud_count, last_detected
                        ))
                        logger.info(f"Added fraud location for {charge_point_id} with {fraud_count} fraud cases")
                        
                        # Commit every 10 records
                        if i % 10 == 0:
                            conn.commit()
                            logger.info(f"Committed {i} records")
                    except Exception as e:
                        logger.error(f"Error processing case {i}: {str(e)}")
                        continue
                
                conn.commit()
                logger.info("Finished updating fraud locations")
        except Exception as e:
            logger.error(f"Error updating fraud locations: {str(e)}")
            raise

    def get_all_fraud_locations(self) -> List[Dict]:
        """Retrieve all fraud locations for map display."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT 
                        fl.Location_ID,
                        fl.Charge_Point_ID,
                        fl.Latitude,
                        fl.Longitude,
                        fl.Address,
                        fl.ZIP,
                        fl.City,
                        fl.Country,
                        fl.Fraud_Count,
                        fl.Last_Detected_Date,
                        TRIM(
                            COALESCE(fg.Reason1 || '; ', '') ||
                            COALESCE(fg.Reason2 || '; ', '') ||
                            COALESCE(fg.Reason3 || '; ', '') ||
                            COALESCE(fg.Reason4 || '; ', '') ||
                            COALESCE(fg.Reason5 || '; ', '') ||
                            COALESCE(fg.Reason6 || '; ', '') ||
                            COALESCE(fg.Reason7, '')
                        ) as reasons
                    FROM FraudLocations fl
                    LEFT JOIN CDR c ON fl.Charge_Point_ID = c.Charge_Point_ID
                    LEFT JOIN FraudCase fg ON fg.CDR_ID = c.CDR_ID
                    GROUP BY fl.Location_ID
                    ORDER BY fl.Fraud_Count DESC
                """)
                
                columns = [description[0] for description in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                logger.info(f"Retrieved {len(results)} fraud locations")
                return results
        except Exception as e:
            logger.error(f"Error retrieving fraud locations: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving fraud locations: {str(e)}")
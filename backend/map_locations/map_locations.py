import sqlite3
import os
from typing import List, Dict, Any

class MapLocations:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def create_map_locations_table(self, cursor):
        """Creates the MapLocations table if it doesn't exist."""
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS MapLocations (
            CDR_ID TEXT PRIMARY KEY,
            Charge_Point_Address TEXT,
            Charge_Point_ZIP TEXT,
            Charge_Point_City TEXT,
            Charge_Point_Country TEXT,
            Charge_Point_Type TEXT,
            Tariff_Type TEXT,
            Fraud_Reason TEXT,
            FOREIGN KEY (CDR_ID) REFERENCES CDR(CDR_ID)
        )
        """)

    def populate_map_locations(self):
        """Populates the MapLocations table with data from CDR and FraudeGeval tables."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Create the table
            self.create_map_locations_table(cursor)

            # Insert data from CDR and FraudeGeval tables
            cursor.execute("""
            INSERT OR REPLACE INTO MapLocations (
                CDR_ID,
                Charge_Point_Address,
                Charge_Point_ZIP,
                Charge_Point_City,
                Charge_Point_Country,
                Charge_Point_Type,
                Tariff_Type,
                Fraud_Reason
            )
            SELECT 
                c.CDR_ID,
                c.Charge_Point_Address,
                c.Charge_Point_ZIP,
                c.Charge_Point_City,
                c.Charge_Point_Country,
                c.Charge_Point_Type,
                c.Tariff_Type,
                COALESCE(f.Reden, f.Reden2, f.Reden3, f.Reden4) as Fraud_Reason
            FROM CDR c
            LEFT JOIN FraudeGeval f ON c.CDR_ID = f.CDR_ID
            WHERE f.CDR_ID IS NOT NULL
            """)

            conn.commit()
            print("MapLocations table populated successfully")
            return True

        except Exception as e:
            print(f"Error populating MapLocations table: {str(e)}")
            if conn:
                conn.rollback()
            return False

        finally:
            if conn:
                conn.close()

    def get_map_locations(self) -> List[Dict[str, Any]]:
        """Retrieves all map locations with their associated data."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
            SELECT 
                CDR_ID,
                Charge_Point_Address,
                Charge_Point_ZIP,
                Charge_Point_City,
                Charge_Point_Country,
                Charge_Point_Type,
                Tariff_Type,
                Fraud_Reason
            FROM MapLocations
            """)

            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            return [dict(zip(columns, row)) for row in rows]

        except Exception as e:
            print(f"Error retrieving map locations: {str(e)}")
            return []

        finally:
            if conn:
                conn.close() 
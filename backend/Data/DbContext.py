import sqlite3

# from datetime import datetime
import pandas as pd
import logging
import os
from typing import Tuple, Optional


class DbContext:
    def __init__(self, db_name="project-d.db"):
        # Get the parent directory of the current file's directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Construct the correct db path
        self.db_name = os.path.join(base_dir, db_name)
        print("Database path:", self.db_name)
        self.connection = None

        # Import logger
        self.import_logger = logging.getLogger("import_logger")
        self.import_logger.setLevel(logging.INFO)
        import_handler = logging.FileHandler("import_log.txt")
        import_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        if not self.import_logger.handlers:
            self.import_logger.addHandler(import_handler)

        # Export logger
        self.export_logger = logging.getLogger("export_logger")
        self.export_logger.setLevel(logging.INFO)
        export_handler = logging.FileHandler("export_log.txt")
        export_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
        if not self.export_logger.handlers:
            self.export_logger.addHandler(export_handler)
        # Initialize logging
        logging.basicConfig(
            filename="import_log.txt",
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
        )

    def connect(self):
        """Establish a connection to the SQLite database."""
        self.connection = sqlite3.connect(self.db_name)
        print(f"Connected to {self.db_name}")

    def create_table(self, table_name, schema):
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_name} ({schema})")
            self.connection.commit()
            print(f"Table '{table_name}' created or already exists.")
        else:
            print("No database connection. Call connect() first.")

    def initialize_database(self):
        """Initialize the database by creating all required tables."""
        self.connect()

        # Define the schema for the CDR (Charge Detail Record) table
        cdr_schema = """
            CDR_ID TEXT PRIMARY KEY,
            Start_datetime TEXT,
            End_datetime TEXT,
            Duration INTEGER,
            Volume REAL,
            Charge_Point_Address TEXT,
            Charge_Point_ZIP TEXT,
            Charge_Point_City TEXT,
            Charge_Point_Country TEXT,
            Charge_Point_Type TEXT,
            Product_Type TEXT,
            Tariff_Type TEXT,
            Authentication_ID TEXT,
            Contract_ID TEXT,
            Meter_ID TEXT,
            OBIS_Code TEXT,
            Charge_Point_ID TEXT,
            Service_Provider_ID TEXT,
            Infra_Provider_ID TEXT ,
            Calculated_Cost REAL 
        """

        # Create the CDR table
        self.create_table("CDR", cdr_schema)
        self.close()

    def insert_cdr(self, cdr_data):
        """Insert a new CDR record into the database."""
        if self.connection:
            cursor = self.connection.cursor()
            columns = ", ".join(cdr_data.keys())
            placeholders = ", ".join(["?"] * len(cdr_data))
            sql = f"INSERT INTO CDR ({columns}) VALUES ({placeholders})"
            cursor.execute(sql, list(cdr_data.values()))
            self.connection.commit()
            print(f"Inserted new CDR record with ID: {cdr_data['CDR_ID']}")
        else:
            print("No database connection. Call connect() first.")

    def get_cdr(self, cdr_id):
        """Retrieve a CDR record by its ID."""
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute("SELECT * FROM CDR WHERE CDR_ID = ?", (cdr_id,))
            return cursor.fetchone()
        else:
            print("No database connection. Call connect() first.")
            return None
    
    def GetAllDataFromDatabase(self):
        """Retrieve all CDR records."""
        if self.connection:
            cursor = self.connection.cursor()
            cursor.execute("SELECT * FROM CDR")
            return cursor.fetchall()
        else:
            print("No database connection. Call connect() first.")
            return None

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            print(f"Connection to {self.db_name} closed.")

    def import_excel_to_database(self, excel_file_path):
        """
        Import data from an Excel file into the CDR table and log the results.

        Args:
            excel_file_path (str): Path to the Excel file to import

        Returns:
            int: Number of records successfully imported
        """
        try:
            # Extract the file name from the full path
            file_name = os.path.basename(excel_file_path)

            # Read the Excel file
            df = pd.read_excel(excel_file_path)

            # Ensure all required columns are present
            required_columns = [
                "CDR_ID",
                "Start_datetime",
                "End_datetime",
                "Duration",
                "Volume",
                "Charge_Point_Address",
                "Charge_Point_ZIP",
                "Charge_Point_City",
                "Charge_Point_Country",
                "Charge_Point_Type",
                "Product_Type",
                "Tariff_Type",
                "Authentication_ID",
                "Contract_ID",
                "Meter_ID",
                "OBIS_Code",
                "Charge_Point_ID",
                "Service_Provider_ID",
                "Infra_Provider_ID",
                "Calculated_Cost",
            ]

            # Check if all required columns are present
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(
                    f"Missing required columns in Excel file: {missing_columns}"
                )

            # Connect to database
            self.connect()

            # Prepare the insert statement
            cursor = self.connection.cursor()
            columns = ", ".join(required_columns)
            placeholders = ", ".join(["?"] * len(required_columns))
            insert_sql = f"INSERT INTO CDR ({columns}) VALUES ({placeholders})"

            # Convert DataFrame to list of tuples for insertion
            records = [tuple(row) for row in df[required_columns].values]

            # Insert all records
            cursor.executemany(insert_sql, records)
            self.connection.commit()

            # Log success
            self.import_logger.info(f"Successfully imported {len(records)} records from {file_name}")
            logging.info(
                f"Successfully imported {len(records)} records from {file_name}"
            )
            print(f"Successfully imported {len(records)} records from {file_name}")
            return len(records)

        except Exception as e:
            # Log failure
            file_name = os.path.basename(excel_file_path)
            self.import_logger.error(f"Failed to import records from {file_name}. Error: {str(e)}")
            print(f"Error importing Excel file: {str(e)}")
            if self.connection:
                self.connection.rollback()
            return 0

        finally:
            if self.connection:
                self.close()


    def export_cdr_to_file(self, output_path: str, columns: Optional[str] = None) -> Tuple[bool, int]:
        """Export all CDR data to CSV or Excel, and log the result."""
        try:
            self.connect()
            query = f"SELECT {columns} FROM CDR" if columns else "SELECT * FROM CDR"

            df = pd.read_sql_query(query, self.connection)
            
            record_count = len(df)
            if record_count == 0:
                msg = "No records found in the database"
                self.export_logger.warning(msg)
                print(msg)
                return False, 0

            if output_path.endswith(('.xlsx', '.xls')):
                df.to_excel(output_path, index=False)
            elif output_path.endswith('.csv'):
                df.to_csv(output_path, index=False)
            else:
                msg = f"Export failed: Unsupported file format for {output_path}"
                self.import_logger.error(msg)
                print("Unsupported file format. Please use .csv or .xlsx/.xls")
                return False, record_count

            msg = f"Successfully exported {record_count} records to {output_path}"
            self.export_logger.info(msg)
            print(f"Data exported successfully to {output_path}")
            return True, record_count

        except Exception as e:
            msg = f"Failed to export records to {output_path}. Error: {str(e)}"
            self.export_logger.error(msg)
            print(f"Error exporting data: {str(e)}")
            return False, 0

        finally:
            self.close()

    def get_overlapping_sessions(self):
        self.connect()

        query = """
        WITH Overlaps AS (
            SELECT a.CDR_ID AS main_id, b.CDR_ID AS overlap_id, a.*
            FROM CDR a
            JOIN CDR b
            ON a.Authentication_ID = b.Authentication_ID
            AND a.CDR_ID != b.CDR_ID
            AND (
                datetime(a.Start_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(a.End_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(b.Start_datetime) BETWEEN datetime(a.Start_datetime) AND datetime(a.End_datetime)
            )
        )
        SELECT o.main_id AS CDR_ID, o.Authentication_ID, o.Start_datetime, o.End_datetime,
            o.Charge_Point_City, o.Volume,
            COUNT(o.overlap_id) AS OverlappingCount
        FROM Overlaps o
        GROUP BY o.main_id
        ORDER BY o.Authentication_ID, o.Start_datetime
        """

        df = pd.read_sql_query(query, self.connection)
        self.close()
        return df.to_dict(orient="records")
    

    def get_all_overlapping_for_cdr(self, cdr_id):
        self.connect()

        query = f"""
        SELECT b.*
        FROM CDR a
        JOIN CDR b
            ON a.Authentication_ID = b.Authentication_ID
            AND a.CDR_ID = ?
            AND a.CDR_ID != b.CDR_ID
            AND (
                datetime(b.Start_datetime) BETWEEN datetime(a.Start_datetime) AND datetime(a.End_datetime)
                OR datetime(b.End_datetime) BETWEEN datetime(a.Start_datetime) AND datetime(a.End_datetime)
                OR datetime(a.Start_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
            )

        UNION

        SELECT a.*
        FROM CDR a
        JOIN CDR b
            ON b.Authentication_ID = a.Authentication_ID
            AND b.CDR_ID = ?
            AND b.CDR_ID != a.CDR_ID
            AND (
                datetime(a.Start_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(a.End_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(b.Start_datetime) BETWEEN datetime(a.Start_datetime) AND datetime(a.End_datetime)
            )

        UNION

        SELECT *
        FROM CDR
        WHERE CDR_ID = ?
        """

        df = pd.read_sql_query(query, self.connection, params=(cdr_id, cdr_id, cdr_id))
        self.close()
        return df.drop_duplicates(subset="CDR_ID").to_dict(orient="records")
    
    # Haalt alle statistieken per Authentication_ID op: aantal transacties, totaal volume en totale kosten
    def get_user_stats(self):
        self.connect()

        query = """
        SELECT 
            Authentication_ID,
            COUNT(*) AS TransactionCount,
            SUM(Volume) AS TotalVolume,
            SUM(Calculated_Cost) AS TotalCost
        FROM CDR
        GROUP BY Authentication_ID
        ORDER BY Authentication_ID
        """

        cursor = self.connection.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in rows]

        self.close()
        return result
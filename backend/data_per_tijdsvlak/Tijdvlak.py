from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# Database configuration - using a simple path in the current directory
DATABASE_PATH = os.path.join(os.path.dirname(__file__), '../project-d.db')

class DbContext:
    def __init__(self):
        self.connection = None
    
    def connect(self):
        try:
            # Connect to the database (will create it if it doesn't exist)
            self.connection = sqlite3.connect(DATABASE_PATH)
            self._initialize_database()
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
            raise
    
    def _initialize_database(self):
        cursor = self.connection.cursor()
        # Create table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS CDR (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                Start_datetime TEXT NOT NULL,
                Calculated_Cost REAL NOT NULL
            )
        """)
        self.connection.commit()
    
    def close(self):
        if self.connection:
            self.connection.close()

def get_data():
    db = DbContext()
    try:
        db.connect()
        
        cursor = db.connection.cursor()
        # First check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='CDR'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("CDR table doesn't exist - creating it")
            db._initialize_database()
            return []

        # Query the data
        query = """
            SELECT strftime('%H%M', Start_datetime) AS time, 
            Calculated_Cost AS amount 
            FROM CDR
        """
        
        cursor.execute("SELECT COUNT(*) FROM CDR")
        count = cursor.fetchone()[0]
        print(f"Total rows in CDR: {count}")
        
        if count == 0:
            print("CDR table is empty")
            return []
            
        cursor.execute(query)
        rows = cursor.fetchall()

        data = [{'time': row[0], 'amount': row[1]} for row in rows]
        return data
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []
    finally:
        db.close()

def calculate_usage_counts(data):
    time_ranges = {
        '0000-0900': 0,
        '0900-1300': 0,
        '1300-1700': 0,
        '1700-2100': 0,
        '2100-0000': 0
    }

    for entry in data:
        try:
            time = int(entry['time'])
            if 0 <= time < 900:
                time_ranges['0000-0900'] += 1
            elif 900 <= time < 1300:
                time_ranges['0900-1300'] += 1
            elif 1300 <= time < 1700:
                time_ranges['1300-1700'] += 1
            elif 1700 <= time < 2100:
                time_ranges['1700-2100'] += 1
            elif 2100 <= time < 2400:
                time_ranges['2100-0000'] += 1
        except (ValueError, KeyError):
            continue

    return time_ranges

@app.route('/api/usage-counts', methods=['GET'])
def usage_counts():
    try:
        data = get_data()
        usage = calculate_usage_counts(data)
        return jsonify(usage)
    except Exception as e:
        print(f"Error in usage_counts: {e}")
        return jsonify({"error": "Internal server error"}), 500

def insert_sample_data():
    """Helper function to insert sample data for testing"""
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()
        # Insert some sample data
        sample_data = [
            ('2023-01-01 08:30:00', 1.50),
            ('2023-01-01 10:15:00', 2.00),
            ('2023-01-01 14:45:00', 3.25),
            ('2023-01-01 18:30:00', 1.75),
            ('2023-01-01 22:15:00', 4.50),
        ]
        cursor.executemany("INSERT INTO CDR (Start_datetime, Calculated_Cost) VALUES (?, ?)", sample_data)
        db.connection.commit()
        print("Inserted 5 sample records")
    except Exception as e:
        print(f"Error inserting sample data: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    # Insert sample data if needed
    # insert_sample_data()
    app.run(debug=True, port=5000)
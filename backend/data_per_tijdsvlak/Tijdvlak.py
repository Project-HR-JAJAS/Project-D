from flask import Flask, jsonify
from flask_cors import CORS
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from Data.DbContext import DbContext

app = Flask(__name__)
CORS(app)


def get_data():
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()

        # Check if table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='CDR'"
        )
        table_exists = cursor.fetchone()

        if not table_exists:
            print("CDR table doesn't exist - creating it")
            # Create table without closing the connection
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS CDR (
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
                    Infra_Provider_ID TEXT,
                    Calculated_Cost REAL
                )
            """)
            db.connection.commit()
            print("CDR table created")
            return []  # No data yet since the table was just created

        # Query all data from CDR table
        cursor.execute("SELECT * FROM CDR")
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        print(f"Found {len(rows)} records in CDR table")  # Add this line
        
        data = [dict(zip(columns, row)) for row in rows]
        return data
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        db.close()  # Now closes only after all operations


def calculate_usage_counts(data):
    time_ranges = {
        "0000-0900": 0,
        "0900-1300": 0,
        "1300-1700": 0,
        "1700-2100": 0,
        "2100-0000": 0,
    }

    if not data:  # Check if data is empty
        return time_ranges

    for entry in data:
        try:
            if not entry.get("Start_datetime"):
                continue

            # Split date and time safely
            datetime_parts = entry["Start_datetime"].split()
            if len(datetime_parts) < 2:
                continue

            time_str = datetime_parts[1]
            time_parts = time_str.split(":")
            if len(time_parts) < 2:
                continue

            hours = int(time_parts[0])
            minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
            time = hours * 100 + minutes

            if 0 <= time < 900:
                time_ranges["0000-0900"] += 1
            elif 900 <= time < 1300:
                time_ranges["0900-1300"] += 1
            elif 1300 <= time < 1700:
                time_ranges["1300-1700"] += 1
            elif 1700 <= time < 2100:
                time_ranges["1700-2100"] += 1
            elif 2100 <= time < 2400:
                time_ranges["2100-0000"] += 1
        except (ValueError, KeyError, AttributeError, IndexError) as e:
            print(f"Error processing entry {entry.get('CDR_ID', 'unknown')}: {e}")
            continue

    return time_ranges


@app.route("/api/usage-counts", methods=["GET"])
def usage_counts():
    try:
        data = get_data()
        usage = calculate_usage_counts(data)
        return jsonify(usage)
    except Exception as e:
        print(f"Error in usage_counts: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/usage-data/<time_range>", methods=["GET"])
def usage_data(time_range):
    try:
        data = get_data()
        filtered_data = filter_data_by_time_range(data, time_range)
        return jsonify(filtered_data)
    except Exception as e:
        print(f"Error in usage_data: {e}")
        return jsonify({"error": "Internal server error"}), 500


def filter_data_by_time_range(data, time_range):
    time_mapping = {
        "0000-0900": (0, 900),
        "0900-1300": (900, 1300),
        "1300-1700": (1300, 1700),
        "1700-2100": (1700, 2100),
        "2100-0000": (2100, 2400),
    }

    if time_range not in time_mapping:
        return []

    start, end = time_mapping[time_range]
    filtered = []

    for entry in data:
        try:
            time_str = entry["Start_datetime"].split()[1]
            hours, minutes, _ = time_str.split(":")
            time = int(hours) * 100 + int(minutes)  # Correct time calculation

            if start <= time < end:
                filtered.append(entry)
        except (ValueError, KeyError, AttributeError) as e:
            print(f"Error processing entry: {e}")
            continue

    return filtered


if __name__ == "__main__":
    app.run(debug=True, port=5000)

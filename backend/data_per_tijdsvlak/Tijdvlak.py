from flask import Flask, jsonify
from flask_cors import CORS
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from Data.DbContext import DbContext

app = Flask(__name__)
CORS(app)

def get_charge_counts():
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()

        # Query to get total charge counts per time range
        query = """
        SELECT 
            CASE 
                WHEN time(Start_datetime) BETWEEN '00:00:00' AND '08:59:59' THEN '0000-0900'
                WHEN time(Start_datetime) BETWEEN '09:00:00' AND '12:59:59' THEN '0900-1300'
                WHEN time(Start_datetime) BETWEEN '13:00:00' AND '16:59:59' THEN '1300-1700'
                WHEN time(Start_datetime) BETWEEN '17:00:00' AND '20:59:59' THEN '1700-2100'
                WHEN time(Start_datetime) >= '21:00:00' OR time(Start_datetime) < '00:00:00' THEN '2100-0000'
            END as TimeRange,
            COUNT(*) as TotalCharges
        FROM CDR
        GROUP BY TimeRange
        ORDER BY TimeRange
        """
        
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        
        # Initialize all time ranges with 0 counts
        time_ranges = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000']
        result = {tr: {'TotalCharges': 0} for tr in time_ranges}
        
        # Update with actual data from query
        for row in rows:
            time_range = row[0]
            if time_range in result:
                result[time_range]['TotalCharges'] = row[1]
        
        # Convert to list format for the frontend
        formatted_result = [{
            'TimeRange': tr,
            'TotalCharges': data['TotalCharges']
        } for tr, data in result.items()]
        
        return formatted_result
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        db.close()

def get_charge_details(time_range):
    db = DbContext()
    try:
        db.connect()
        cursor = db.connection.cursor()

        # Define time range conditions
        time_conditions = {
            '0000-0900': "time(Start_datetime) BETWEEN '00:00:00' AND '08:59:59'",
            '0900-1300': "time(Start_datetime) BETWEEN '09:00:00' AND '12:59:59'",
            '1300-1700': "time(Start_datetime) BETWEEN '13:00:00' AND '16:59:59'",
            '1700-2100': "time(Start_datetime) BETWEEN '17:00:00' AND '20:59:59'",
            '2100-0000': "(time(Start_datetime) >= '21:00:00' OR time(Start_datetime) < '00:00:00')"
        }

        if time_range not in time_conditions:
            return []

        # Query to get all charges for a specific time range
        query = f"""
        SELECT *
        FROM CDR
        WHERE {time_conditions[time_range]}
        """
        
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        
        data = [dict(zip(columns, row)) for row in rows]
        return data
    except Exception as e:
        print(f"Database error: {e}")
        return []
    finally:
        db.close()

@app.route("/api/charge-counts", methods=["GET"])
def charge_counts():
    try:
        data = get_charge_counts()
        return jsonify(data)
    except Exception as e:
        print(f"Error in charge_counts: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/charge-details/<time_range>", methods=["GET"])
def charge_details(time_range):
    try:
        valid_ranges = ['0000-0900', '0900-1300', '1300-1700', '1700-2100', '2100-0000']
        if time_range not in valid_ranges:
            return jsonify({"error": "Invalid time range"}), 400
            
        data = get_charge_details(time_range)
        return jsonify(data)
    except Exception as e:
        print(f"Error in charge_details: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
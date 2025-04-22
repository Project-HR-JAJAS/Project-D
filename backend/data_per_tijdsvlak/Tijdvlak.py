from backend.Data.DbContext import DbContext
from flask import Flask, jsonify

app = Flask(__name__)    

def get_data():
    db = DbContext()  # Initialize the database context
    db.connect()  # Connect to the database

    try:
        # Query the database for relevant data
        query = (
            "SELECT strftime('%H%M', Start_datetime) AS time, "
            "Calculated_Cost AS amount "
            "FROM CDR"
        )
        
        cursor = db.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM CDR")
        count = cursor.fetchone()[0]
        print("Total rows in CDR:", count)
        cursor.execute(query)
        rows = cursor.fetchall()

        # Convert the query result into a list of dictionaries
        data = [{'time': row[0], 'amount': row[1]} for row in rows]
        return data
    finally:
        db.close()  # Ensure the database connection is closed


def calculate_usage_counts(data):
    time_ranges = {
        '0000-0900': 0,
        '0900-1300': 0,
        '1300-1700': 0,
        '1700-2100': 0,
        '2100-0000': 0
    }

    for entry in data:
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

    return time_ranges


@app.route('/api/usage-counts', methods=['GET'])
def usage_counts():
    data = get_data()
    usage = calculate_usage_counts(data)
    return jsonify(usage)

def main():
    app.run(debug=True)

if __name__ == '__main__':
    main()
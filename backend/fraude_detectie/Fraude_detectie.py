import sqlite3
import os
import pandas as pd
from typing import Optional
import math

# Configurable threshold values
# These values can be adjusted based on the specific requirements of the fraud detection logic
MAX_VOLUME_KWH = 22 
# Maximum volume in kWh for a session to be considered suspicious
MAX_DURATION_MINUTES = 60
# Maximum duration in minutes for a session to be considered suspicious
MIN_COST_THRESHOLD = 20
# Minimum cost threshold for a session to be considered suspicious
MAX_VOLUME_THRESHOLD = 22
# Maximum volume in kWh for a session to be considered suspicious
MIN_TIME_GAP_MINUTES = 30
# Minimum time gap in minutes between two sessions for them to be considered separate
THRESHOLD = 3
# Minimum number of occurrences for a behavior to be considered suspicious
MIN_DISTANCE_KM = 10
# Minimum distance in km for a session to be considered suspicious
MIN_TRAVEL_TIME_MINUTES = 15


class FraudDetector:
    def __init__(self, db_path):
        self.db_path = db_path

    def _create_fraud_table(self, cursor):
        """Creates the FraudCase table if it doesn't exist."""
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS FraudCase (
            CDR_ID TEXT NOT NULL,
            Reason1 TEXT,
            Reason2 TEXT,
            Reason3 TEXT,
            Reason4 TEXT,
            Reason5 TEXT,
            Reason6 TEXT,
            Reason7 TEXT,
            FOREIGN KEY (CDR_ID) REFERENCES CDR(CDR_ID)
        )
        """)

    def _safe_float(self, value: Optional[str]) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(str(value).replace(",", "."))
        except (ValueError, TypeError):
            return None

    def _update_fraud_table(
        self, cursor, reason: str, ids: list, reason_field: str = "Reason1"
    ):
        if not ids:
            return

        placeholders = ",".join(["?"] * len(ids))
        cursor.execute(
            f"""
            SELECT CDR_ID FROM FraudCase 
            WHERE CDR_ID IN ({placeholders}) AND {reason_field} = ?
            """,
            ids + [reason],
        )
        existing_ids_with_same_reason = {row[0] for row in cursor.fetchall()}

        cursor.execute(
            f"""
            SELECT CDR_ID FROM FraudCase 
            WHERE CDR_ID IN ({placeholders})
            """,
            ids,
        )
        all_existing_ids = {row[0] for row in cursor.fetchall()}

        update_ids = all_existing_ids - existing_ids_with_same_reason
        if update_ids:
            update_sql = f"""
            UPDATE FraudCase 
            SET {reason_field} = ?
            WHERE CDR_ID = ?
            """
            cursor.executemany(update_sql, [(reason, cdr_id) for cdr_id in update_ids])

        new_ids = [cdr_id for cdr_id in ids if cdr_id not in all_existing_ids]
        if new_ids:
            insert_sql = f"""
            INSERT INTO FraudCase (CDR_ID, {reason_field}) 
            VALUES (?, ?)
            """
            cursor.executemany(insert_sql, [(cdr_id, reason) for cdr_id in new_ids])

    def detect_high_volume_short_duration(self, cursor):
        cursor.execute("""
        SELECT CDR_ID
        FROM CDR
        WHERE Volume IS NOT NULL AND Volume != '' AND Duration IS NOT NULL AND Duration != ''
        """)
        valid_records = cursor.fetchall()
        fraud_ids = []

        for row in valid_records:
            cdr_id = row[0]
            cursor.execute(
                "SELECT Volume, Duration FROM CDR WHERE CDR_ID = ?",
                (cdr_id,),
            )
            volume_str, duration = cursor.fetchone()
            try:
                volume = self._safe_float(volume_str)
                if volume is None:
                    continue
                h, m, s = map(int, duration.split(":"))
                duration_minutes = h * 60 + m + s / 60
                if volume > MAX_VOLUME_KWH and duration_minutes < MAX_DURATION_MINUTES:
                    fraud_ids.append(cdr_id)
            except (ValueError, AttributeError):
                continue

        self._update_fraud_table(cursor, "High volume in short duration", fraud_ids, "Reason1")

    def detect_high_cost_low_volume(self, cursor):
        cursor.execute("""
        SELECT CDR_ID, Volume, Calculated_Cost
        FROM CDR
        WHERE Volume IS NOT NULL AND Volume != '' AND Calculated_Cost IS NOT NULL
        """)
        results = cursor.fetchall()
        fraud_data = []

        for row in results:
            cdr_id, volume_str, cost = row
            try:
                volume = self._safe_float(volume_str)
                if volume is None or cost is None:
                    continue
                if cost > MIN_COST_THRESHOLD and volume < MAX_VOLUME_THRESHOLD:
                    ratio = cost / volume
                    fraud_data.append((cdr_id, ratio))
            except (ValueError, TypeError, ZeroDivisionError):
                continue

        for cdr_id, ratio in fraud_data:
            reason = f"Unusual cost per kWh (ratio: {ratio:.2f})"
            self._update_fraud_table(cursor, reason, [cdr_id], "Reason2")

    def detect_rapid_consecutive_sessions(self, cursor):
        cursor.execute(
            f"""
        SELECT CDR_ID
        FROM (
            SELECT 
                CDR_ID,
                LAG(End_datetime) OVER (
                    PARTITION BY Authentication_ID, Charge_Point_ID 
                    ORDER BY Start_datetime
                ) AS PrevEnd,
                Start_datetime
            FROM CDR
        )
        WHERE 
            PrevEnd IS NOT NULL
            AND ((julianday(Start_datetime) - julianday(PrevEnd)) * 1440 < ?)
        """,
            (MIN_TIME_GAP_MINUTES,),
        )
        fraud_ids = [row[0] for row in cursor.fetchall()]
        self._update_fraud_table(
            cursor,
            f"Rapid consecutive sessions (<{MIN_TIME_GAP_MINUTES} min)",
            fraud_ids,
            "Reason3",
        )

    def detect_overlapping_sessions(self, cursor):
        cursor.execute("""
        WITH Overlaps AS (
            SELECT a.CDR_ID
            FROM CDR a
            JOIN CDR b ON a.Authentication_ID = b.Authentication_ID AND a.CDR_ID != b.CDR_ID
            AND (
                datetime(a.Start_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(a.End_datetime) BETWEEN datetime(b.Start_datetime) AND datetime(b.End_datetime)
                OR datetime(b.Start_datetime) BETWEEN datetime(a.Start_datetime) AND datetime(a.End_datetime)
            )
        )
        SELECT CDR_ID FROM Overlaps GROUP BY CDR_ID
        """)
        fraud_ids = [row[0] for row in cursor.fetchall()]
        self._update_fraud_table(cursor, "Overlapping sessions", fraud_ids, "Reason4")

    def detect_repeated_behavior(self, cursor):
        cursor.execute(
            """
        WITH AllReasons AS (
            SELECT CDR_ID, Reason1 AS Reason FROM FraudCase WHERE Reason1 IS NOT NULL
            UNION ALL SELECT CDR_ID, Reason2 FROM FraudCase WHERE Reason2 IS NOT NULL
            UNION ALL SELECT CDR_ID, Reason3 FROM FraudCase WHERE Reason3 IS NOT NULL
            UNION ALL SELECT CDR_ID, Reason4 FROM FraudCase WHERE Reason4 IS NOT NULL
        )
        SELECT 
            c.Authentication_ID,
            ar.Reason,
            COUNT(*) AS count,
            GROUP_CONCAT(ar.CDR_ID) AS cdr_ids
        FROM AllReasons ar
        JOIN CDR c ON ar.CDR_ID = c.CDR_ID
        GROUP BY c.Authentication_ID, ar.Reason
        HAVING count >= ?
        """,
            (THRESHOLD,),
        )
        for auth_id, reason, count, cdr_ids_str in cursor.fetchall():
            cdr_ids = cdr_ids_str.split(",")
            recurring_reason = f"Repeated behavior ({count}x): {reason}"
            self._update_fraud_table(cursor, recurring_reason, cdr_ids, "Reason5")

    def detect_data_integrity_violation(self, cursor):
        fraud_ids = []
        cursor.execute("SELECT CDR_ID, Authentication_ID, Charge_Point_ID FROM CDR")
        for cdr_id, auth_id, charge_point_id in cursor.fetchall():
            issues = []
            if not cdr_id or str(cdr_id).strip() == "":
                continue
            if not auth_id or str(auth_id).strip() == "":
                issues.append("Missing Authentication_ID")
            if not charge_point_id or str(charge_point_id).strip() == "":
                issues.append("Missing Charge_Point_ID")
            if isinstance(auth_id, str) and auth_id.strip() != auth_id:
                cleaned = auth_id.strip()
                cursor.execute(
                    "UPDATE CDR SET Authentication_ID = ? WHERE CDR_ID = ?",
                    (cleaned, cdr_id),
                )
                issues.append("Cleaned Authentication_ID")
            if (
                isinstance(charge_point_id, str)
                and charge_point_id.strip() != charge_point_id
            ):
                cleaned = charge_point_id.strip()
                cursor.execute(
                    "UPDATE CDR SET Charge_Point_ID = ? WHERE CDR_ID = ?",
                    (cleaned, cdr_id),
                )
                issues.append("Cleaned Charge_Point_ID")
            if issues:
                reason = "Data integrity violation: " + "; ".join(issues)
                fraud_ids.append((cdr_id, reason))
        for cdr_id, reason in fraud_ids:
            self._update_fraud_table(cursor, reason, [cdr_id], "Reason6")

    def detect_impossible_travel(self, cursor):
        cursor.execute("""
        SELECT CDR_ID, Authentication_ID, Start_datetime, End_datetime, Charge_Point_ID
        FROM CDR
        WHERE Start_datetime IS NOT NULL AND End_datetime IS NOT NULL
        ORDER BY Authentication_ID, Start_datetime
        """)
        sessions = cursor.fetchall()
        cursor.execute(
            "SELECT Charge_Point_ID, Latitude, Longitude FROM FraudLocations WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL"
        )
        location_dict = {
            row[0]: (float(row[1]), float(row[2])) for row in cursor.fetchall()
        }
        fraud_ids = []
        prev_session = {}
        for cdr_id, auth_id, start_dt, end_dt, charge_point_id in sessions:
            if auth_id in prev_session:
                prev_cdr_id, prev_end_dt, prev_point = prev_session[auth_id]
                if charge_point_id in location_dict and prev_point in location_dict:
                    lat1, lon1 = location_dict[prev_point]
                    lat2, lon2 = location_dict[charge_point_id]
                    distance = self._calculate_distance_km(lat1, lon1, lat2, lon2)
                    time_diff = (
                        pd.to_datetime(start_dt) - pd.to_datetime(prev_end_dt)
                    ).total_seconds() / 60
                    if (
                        distance >= MIN_DISTANCE_KM
                        and time_diff < MIN_TRAVEL_TIME_MINUTES
                    ):
                        reason = f"Unrealistic movement: {distance:.1f} km in {time_diff:.1f} min"
                        fraud_ids.append((cdr_id, reason))
            prev_session[auth_id] = (cdr_id, end_dt, charge_point_id)
        for cdr_id, reason in fraud_ids:
            self._update_fraud_table(cursor, reason, [cdr_id], "Reason7")

    def _calculate_distance_km(self, lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def detect_fraud(self) -> pd.DataFrame:
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            self._create_fraud_table(cursor)

            self.detect_high_volume_short_duration(cursor)
            self.detect_high_cost_low_volume(cursor)
            self.detect_rapid_consecutive_sessions(cursor)
            self.detect_overlapping_sessions(cursor)
            self.detect_repeated_behavior(cursor)
            self.detect_data_integrity_violation(cursor)
            self.detect_impossible_travel(cursor)

            conn.commit()

            df = pd.read_sql_query(
                """
                SELECT 
                    fc.CDR_ID, 
                    fc.Reason1 AS Reason1,
                    fc.Reason2 AS Reason2,
                    fc.Reason3 AS Reason3,
                    fc.Reason4 AS Reason4,
                    fc.Reason5 AS Reason5,
                    fc.Reason6 AS Reason6,
                    fc.Reason7 AS Reason7,
                    c.Volume,
                    c.Calculated_Cost,
                    CASE 
                        WHEN c.Volume IS NOT NULL AND c.Volume != '' 
                             AND c.Calculated_Cost IS NOT NULL 
                        THEN ROUND(c.Calculated_Cost / CAST(REPLACE(c.Volume, ',', '.') AS REAL), 2)
                        ELSE NULL
                    END AS CostPerKwh
                FROM FraudCase AS fc
                JOIN CDR AS c ON c.CDR_ID = fc.CDR_ID
                ORDER BY fc.CDR_ID
            """,
                conn,
            )
            return df
        except Exception as e:
            print(f"Error during fraud detection: {str(e)}")
            return pd.DataFrame()
        finally:
            if "conn" in locals():
                conn.close()


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(base_dir, "project-d.db")
    detector = FraudDetector(db_file)
    fraud_df = detector.detect_fraud()
    print(fraud_df)
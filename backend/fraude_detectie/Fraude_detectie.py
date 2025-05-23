import sqlite3
import os
import pandas as pd
from typing import Optional
import math

# Configurable threshold values
# Maximum toegestane volume (kWh) voor een sessie
MAX_VOLUME_KWH = 22 
# Maximale duur (in minuten) voor een sessie met hoog volume
MAX_DUUR_MINUTEN = 60
# Minimale kosten (in euro) om als verdacht te worden beschouwd bij laag volume
MIN_COST_THRESHOLD = 20
# Maximale volume (kWh) om als laag volume te worden beschouwd
MAX_VOLUME_THRESHOLD = 22
# Minimale tijdsinterval (in minuten) tussen opeenvolgende sessies
MIN_TIME_GAP_MINUTEN = 30
# Aantal herhalingen voordat gedrag als herhaaldelijk wordt gezien
THRESHOLD = 3
# Minimale afstand (in km) tussen laadpunten voor onmogelijke verplaatsing
MIN_AFSTAND_KM = 10
# Minimale reistijd (in minuten) voor onmogelijke verplaatsing
MIN_REISTIJD_MINUTEN = 15


class FraudeDetector:
    def __init__(self, db_path):
        self.db_path = db_path

    def _maak_fraudetabel(self, cursor):
        """Maakt de tabel FraudeGeval aan als die nog niet bestaat."""
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS FraudeGeval (
            CDR_ID TEXT NOT NULL,
            Reden TEXT,
            Reden2 TEXT,
            Reden3 TEXT,
            Reden4 TEXT,
            Reden5 TEXT,
            Reden6 TEXT,
            Reden7 TEXT,
            FOREIGN KEY (CDR_ID) REFERENCES CDR(CDR_ID)
        )
        """)

    def _safe_float(self, value: Optional[str]) -> Optional[float]:
        """Safely convert string to float, handling None and comma decimals."""
        if value is None:
            return None
        try:
            return float(str(value).replace(",", "."))
        except (ValueError, TypeError):
            return None

    def _vul_fraudetabel(
        self, cursor, reden: str, ids: list, reden_field: str = "Reden"
    ):
        """Voegt voor elk CDR_ID in ids een nieuwe reden toe aan het opgegeven redenveld."""
        if not ids:
            return

        placeholders = ",".join(["?"] * len(ids))
        cursor.execute(
            f"""
            SELECT CDR_ID FROM FraudeGeval 
            WHERE CDR_ID IN ({placeholders}) AND {reden_field} = ?
            """,
            ids + [reden],
        )
        existing_ids_with_same_reason = {row[0] for row in cursor.fetchall()}

        cursor.execute(
            f"""
            SELECT CDR_ID FROM FraudeGeval 
            WHERE CDR_ID IN ({placeholders})
            """,
            ids,
        )
        all_existing_ids = {row[0] for row in cursor.fetchall()}

        update_ids = all_existing_ids - existing_ids_with_same_reason
        if update_ids:
            update_sql = f"""
            UPDATE FraudeGeval 
            SET {reden_field} = ?
            WHERE CDR_ID = ?
            """
            cursor.executemany(update_sql, [(reden, cdr_id) for cdr_id in update_ids])

        new_ids = [cdr_id for cdr_id in ids if cdr_id not in all_existing_ids]
        if new_ids:
            insert_sql = f"""
            INSERT INTO FraudeGeval (CDR_ID, {reden_field}) 
            VALUES (?, ?)
            """
            cursor.executemany(insert_sql, [(cdr_id, reden) for cdr_id in new_ids])

    def detecteer_hoog_volume_korte_duur(self, cursor):
        """Detecteert calls met te hoog volume in te korte tijd."""
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
                if volume > MAX_VOLUME_KWH and duration_minutes < MAX_DUUR_MINUTEN:
                    fraud_ids.append(cdr_id)
            except (ValueError, AttributeError):
                continue

        self._vul_fraudetabel(cursor, "Hoog volume in korte duur", fraud_ids, "Reden")

    def detecteer_hoge_kosten_laag_volume(self, cursor):
        """Detecteert sessies met hoge kosten en laag volume."""
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
            reason = f"Ongebruikelijke kost per kWh (ratio: {ratio:.2f})"
            self._vul_fraudetabel(cursor, reason, [cdr_id], "Reden2")

    def detecteer_snelle_opeenvolgende_sessies(self, cursor):
        """Detecteert sessies die te snel achter elkaar plaatsvinden."""
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
            (MIN_TIME_GAP_MINUTEN,),
        )
        fraud_ids = [row[0] for row in cursor.fetchall()]
        self._vul_fraudetabel(
            cursor,
            f"Snel opeenvolgend (<{MIN_TIME_GAP_MINUTEN} min)",
            fraud_ids,
            "Reden3",
        )

    def detecteer_overlappende_sessies(self, cursor):
        """Detecteert sessies die elkaar overlappen."""
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
        self._vul_fraudetabel(cursor, "Overlappende sessies", fraud_ids, "Reden4")

    def detecteer_herhaaldelijk_gedrag(self, cursor):
        """Detecteert herhaaldelijk gedrag met dezelfde reden."""
        cursor.execute(
            """
        WITH AllReasons AS (
            SELECT CDR_ID, Reden AS Reason FROM FraudeGeval WHERE Reden IS NOT NULL
            UNION ALL SELECT CDR_ID, Reden2 FROM FraudeGeval WHERE Reden2 IS NOT NULL
            UNION ALL SELECT CDR_ID, Reden3 FROM FraudeGeval WHERE Reden3 IS NOT NULL
            UNION ALL SELECT CDR_ID, Reden4 FROM FraudeGeval WHERE Reden4 IS NOT NULL
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
            recurring_reason = f"Herhaaldelijk ({count}x): {reason}"
            self._vul_fraudetabel(cursor, recurring_reason, cdr_ids, "Reden5")

    def detecteer_data_integriteitsschending(self, cursor):
        """Detecteert data-integriteitsschendingen in de CDR-tabel."""
        fraud_ids = []
        cursor.execute("SELECT CDR_ID, Authentication_ID, Charge_Point_ID FROM CDR")
        for cdr_id, auth_id, charge_point_id in cursor.fetchall():
            problemen = []
            if not cdr_id or str(cdr_id).strip() == "":
                continue
            if not auth_id or str(auth_id).strip() == "":
                problemen.append("Authentication_ID ontbreekt")
            if not charge_point_id or str(charge_point_id).strip() == "":
                problemen.append("Charge_Point_ID ontbreekt")
            if isinstance(auth_id, str) and auth_id.strip() != auth_id:
                cleaned = auth_id.strip()
                cursor.execute(
                    "UPDATE CDR SET Authentication_ID = ? WHERE CDR_ID = ?",
                    (cleaned, cdr_id),
                )
                problemen.append("Authentication_ID opgeschoond")
            if (
                isinstance(charge_point_id, str)
                and charge_point_id.strip() != charge_point_id
            ):
                cleaned = charge_point_id.strip()
                cursor.execute(
                    "UPDATE CDR SET Charge_Point_ID = ? WHERE CDR_ID = ?",
                    (cleaned, cdr_id),
                )
                problemen.append("Charge_Point_ID opgeschoond")
            if problemen:
                reden = "Data-integriteitsschending: " + "; ".join(problemen)
                fraud_ids.append((cdr_id, reden))
        for cdr_id, reden in fraud_ids:
            self._vul_fraudetabel(cursor, reden, [cdr_id], "Reden6")

    def detecteer_onmogelijke_verplaatsing(self, cursor):
        """Detecteert onmogelijke verplaatsingen tussen laadpunten met FraudLocations."""
        cursor.execute("""
        SELECT CDR_ID, Authentication_ID, Start_datetime, End_datetime, Charge_Point_ID
        FROM CDR
        WHERE Start_datetime IS NOT NULL AND End_datetime IS NOT NULL
        ORDER BY Authentication_ID, Start_datetime
        """)
        sessies = cursor.fetchall()
        cursor.execute(
            "SELECT Charge_Point_ID, Latitude, Longitude FROM FraudLocations WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL"
        )
        locatie_dict = {
            row[0]: (float(row[1]), float(row[2])) for row in cursor.fetchall()
        }
        fraud_ids = []
        prev_sessie = {}
        for cdr_id, auth_id, start_dt, end_dt, charge_point_id in sessies:
            if auth_id in prev_sessie:
                prev_cdr_id, prev_end_dt, prev_point = prev_sessie[auth_id]
                if charge_point_id in locatie_dict and prev_point in locatie_dict:
                    lat1, lon1 = locatie_dict[prev_point]
                    lat2, lon2 = locatie_dict[charge_point_id]
                    afstand = self._bereken_afstand_km(lat1, lon1, lat2, lon2)
                    tijdverschil = (
                        pd.to_datetime(start_dt) - pd.to_datetime(prev_end_dt)
                    ).total_seconds() / 60
                    if (
                        afstand >= MIN_AFSTAND_KM
                        and tijdverschil < MIN_REISTIJD_MINUTEN
                    ):
                        reden = f"Onrealistische verplaatsing: {afstand:.1f} km in {tijdverschil:.1f} min"
                        fraud_ids.append((cdr_id, reden))
            prev_sessie[auth_id] = (cdr_id, end_dt, charge_point_id)
        for cdr_id, reden in fraud_ids:
            self._vul_fraudetabel(cursor, reden, [cdr_id], "Reden7")

    def _bereken_afstand_km(self, lat1, lon1, lat2, lon2):
        """Bereken de afstand tussen twee coördinaten in kilometers."""
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

    def detecteer_fraude(self) -> pd.DataFrame:
        """Detecteert fraude in de CDR-tabel en retourneert een DataFrame met resultaten."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            self._maak_fraudetabel(cursor)

            self.detecteer_hoog_volume_korte_duur(cursor)
            self.detecteer_hoge_kosten_laag_volume(cursor)
            self.detecteer_snelle_opeenvolgende_sessies(cursor)
            self.detecteer_overlappende_sessies(cursor)
            self.detecteer_herhaaldelijk_gedrag(cursor)
            self.detecteer_data_integriteitsschending(cursor)
            self.detecteer_onmogelijke_verplaatsing(cursor)

            conn.commit()

            df = pd.read_sql_query(
                """
                SELECT 
                    fg.CDR_ID, 
                    fg.Reden AS Reden1,
                    fg.Reden2 AS Reden2,
                    fg.Reden3 AS Reden3,
                    fg.Reden4 AS Reden4,
                    fg.Reden5 AS Reden5,
                    fg.Reden6 AS Reden6,
                    fg.Reden7 AS Reden7,
                    c.Volume,
                    c.Calculated_Cost,
                    CASE 
                        WHEN c.Volume IS NOT NULL AND c.Volume != '' 
                             AND c.Calculated_Cost IS NOT NULL 
                        THEN ROUND(c.Calculated_Cost / CAST(REPLACE(c.Volume, ',', '.') AS REAL), 2)
                        ELSE NULL
                    END AS CostPerKwh
                FROM FraudeGeval AS fg
                JOIN CDR AS c ON c.CDR_ID = fg.CDR_ID
                ORDER BY fg.CDR_ID
            """,
                conn,
            )
            return df
        except Exception as e:
            print(f"Fout tijdens fraude detectie: {str(e)}")
            return pd.DataFrame()
        finally:
            if "conn" in locals():
                conn.close()


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    #db_file = r"../project-d.db"
    db_file = os.path.join(base_dir, "project-d.db")
    detector = FraudeDetector(db_file)
    fraude_df = detector.detecteer_fraude()
    print(fraude_df)

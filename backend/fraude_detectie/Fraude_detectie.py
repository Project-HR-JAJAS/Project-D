import sqlite3
import os
import pandas as pd
from typing import Optional

# Configurable threshold values
MAX_VOLUME_KWH = 22  # Everything above 22 kWh
MAX_DUUR_MINUTEN = 60  # Shorter than 60 minutes
MIN_COST_THRESHOLD = 20  # Cost > X
MAX_VOLUME_THRESHOLD = 22  # Volume < Y
MIN_TIME_GAP_MINUTEN = 30  # Time gap between sessions in minutes


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

        # Check if records already exist
        placeholders = ",".join(["?"] * len(ids))
        cursor.execute(
            f"""
        SELECT CDR_ID FROM FraudeGeval 
        WHERE CDR_ID IN ({placeholders})
        """,
            ids,
        )
        existing_ids = [row[0] for row in cursor.fetchall()]

        # For existing records, update the specified reason field
        update_sql = f"""
        UPDATE FraudeGeval 
        SET {reden_field} = ?
        WHERE CDR_ID = ?
        """
        cursor.executemany(update_sql, [(reden, cdr_id) for cdr_id in existing_ids])

        # For new records, insert with the specified reason field
        new_ids = [cdr_id for cdr_id in ids if cdr_id not in existing_ids]
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
        WHERE
            Volume IS NOT NULL
        AND Volume != ''
        AND Duration IS NOT NULL
        AND Duration != ''
        """)

        valid_records = cursor.fetchall()
        fraud_ids = []

        for row in valid_records:
            cdr_id = row[0]
            cursor.execute(
                """
            SELECT Volume, Duration
            FROM CDR
            WHERE CDR_ID = ?
            """,
                (cdr_id,),
            )
            volume_str, duration = cursor.fetchone()

            try:
                volume = self._safe_float(volume_str)
                if volume is None:
                    continue

                # Parse duration (HH:MM:SS)
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
        WHERE 
            Volume IS NOT NULL
        AND Volume != ''
        AND Calculated_Cost IS NOT NULL
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

        # Update the table with the new reasons in Reden2
        for cdr_id, ratio in fraud_data:
            reason = f"Ongebruikelijke kost per kWh (ratio: {ratio:.2f})"
            self._vul_fraudetabel(cursor, reason, [cdr_id], "Reden2")

    def detecteer_snelle_opeenvolgende_sessies(self, cursor):
        """Detecteert sessies die snel na elkaar op hetzelfde laadpunt plaatsvinden."""
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
                AND (
                    (julianday(Start_datetime) - julianday(PrevEnd)) * 1440 < ?
                )
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
        """Detecteert sessies die overlappen voor dezelfde Authentication_ID."""
        cursor.execute("""
            WITH Overlaps AS (
                SELECT a.CDR_ID
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
            SELECT CDR_ID FROM Overlaps
            GROUP BY CDR_ID
        """)
        fraud_ids = [row[0] for row in cursor.fetchall()]
        self._vul_fraudetabel(cursor, "Overlappende sessies", fraud_ids, "Reden4")

    def detecteer_fraude(self) -> pd.DataFrame:
        """Voert alle detectiemethodes uit en geeft elk fraudegeval met reden terug als DataFrame."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Maak de fraudetabel aan
            self._maak_fraudetabel(cursor)

            # Roep detectiemethoden aan
            self.detecteer_hoog_volume_korte_duur(cursor)
            self.detecteer_hoge_kosten_laag_volume(cursor)
            self.detecteer_snelle_opeenvolgende_sessies(cursor)
            self.detecteer_overlappende_sessies(cursor)

            conn.commit()

            # Haal fraudegevallen op
            df = pd.read_sql_query(
                """
                SELECT 
                    fg.CDR_ID, 
                    fg.Reden AS Reden1,
                    fg.Reden2 AS Reden2,
                    fg.Reden3 AS Reden3,
                    fg.Reden4 AS Reden4,
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
    db_file = os.path.join(base_dir, "project-d.db")

    detector = FraudeDetector(db_file)
    fraude_df = detector.detecteer_fraude()
    print(fraude_df)

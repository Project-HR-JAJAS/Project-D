import sqlite3
import os
import pandas as pd

# Configurabele drempelwaarden
MAX_VOLUME_KWH = 22  # Alles boven 22 kWh
MAX_DUUR_MINUTEN = 60  # Korter dan 60 minuten

REDEN = "Hoog volume in korte tijd"

class FraudeDetector:
    def __init__(self, db_path):
        self.db_path = db_path

    def voeg_fraude_kolom_toe(self, conn):
        cursor = conn.cursor()
        # Check of kolom al bestaat
        cursor.execute("PRAGMA table_info(CDR)")
        kolommen = [rij[1].lower() for rij in cursor.fetchall()]
        if "fraudereden" not in kolommen:
            cursor.execute("ALTER TABLE CDR ADD COLUMN FraudeReden TEXT")
            print("Kolom 'FraudeReden' toegevoegd aan CDR-tabel.")
        else:
            print("Kolom 'FraudeReden' bestaat al.")
        conn.commit()

    def update_fraude_rijen(self, conn):
        cursor = conn.cursor()
        update_query = f"""
        UPDATE CDR
        SET FraudeReden = '{REDEN}'
        WHERE CAST(REPLACE(Volume, ',', '.') AS REAL) > {MAX_VOLUME_KWH}
          AND (
              (CAST(SUBSTR(Duration, 1, 2) AS INTEGER) * 60) +
              (CAST(SUBSTR(Duration, 4, 2) AS INTEGER)) +
              (CAST(SUBSTR(Duration, 7, 2) AS INTEGER) / 60.0)
          ) < {MAX_DUUR_MINUTEN}
        """
        cursor.execute(update_query)
        affected = cursor.rowcount
        conn.commit()
        print(f"{affected} rijen gemarkeerd als fraude.")

    def detecteer_fraude(self):
        conn = sqlite3.connect(self.db_path)
        self.voeg_fraude_kolom_toe(conn)
        self.update_fraude_rijen(conn)

        query = f"""
        SELECT *, 
            (
                (CAST(SUBSTR(Duration, 1, 2) AS INTEGER) * 60) + 
                (CAST(SUBSTR(Duration, 4, 2) AS INTEGER)) + 
                (CAST(SUBSTR(Duration, 7, 2) AS INTEGER) / 60.0)
            ) AS DurationMinuten,
            CAST(REPLACE(Volume, ',', '.') AS REAL) AS VolumeNum
        FROM CDR
        WHERE FraudeReden = '{REDEN}'
        """

        df = pd.read_sql_query(query, conn)
        conn.close()
        return df

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(base_dir, "project-d.db")

    detector = FraudeDetector(db_file)
    fraude_df = detector.detecteer_fraude()
    
